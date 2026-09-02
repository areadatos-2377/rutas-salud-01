"""Cliente de almacenamiento de objetos (Cloudflare R2, compatible S3) para
evidencia de entregas. Nadie fuera de aqui importa boto3 directamente --
regla explicita, para que cambiar de proveedor sea cambiar variables de
entorno, no codigo. Adaptado del patron documentado en
legacy/referencia_almacenamiento_documentos.md.

boto3 se importa perezoso (dentro de las funciones, no a nivel de modulo)
para que el resto de la app siga funcionando aunque STORAGE_* todavia no
este configurado -- solo estos endpoints fallarian.
"""

import unicodedata
import uuid
from datetime import date
from pathlib import Path
from urllib.parse import quote

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

MAX_EVIDENCIA_BYTES = 15 * 1024 * 1024  # 15MB -- fotos de celular pesan mas que un PDF

# Extension (en minusculas) -> tipo de EvidenciaArchivo.TIPO_CHOICES. Solo
# JPG/PNG para imagenes -- python-pptx (usado al generar la presentacion,
# ver presentacion.py) no puede insertar WEBP/HEIC en una diapositiva, y
# HEIC ademas ni Pillow lo abre sin un plugin aparte. En vez de convertir
# esos formatos al vuelo, se rechazan desde la subida.
EXTENSION_A_TIPO = {
    ".jpg": "foto", ".jpeg": "foto", ".png": "foto",
    ".mp4": "video", ".mov": "video",
    ".pdf": "pdf",
    ".doc": "documento", ".docx": "documento",
}


def _configuracion_r2():
    return (
        settings.STORAGE_ENDPOINT_URL,
        settings.STORAGE_ACCESS_KEY_ID,
        settings.STORAGE_SECRET_ACCESS_KEY,
    )


def _usa_almacen_local():
    return settings.DEBUG and not any(_configuracion_r2())


def _cliente_s3():
    from botocore.client import Config
    import boto3

    if not all(_configuracion_r2()):
        raise ImproperlyConfigured(
            "Configura STORAGE_ENDPOINT_URL, STORAGE_ACCESS_KEY_ID y "
            "STORAGE_SECRET_ACCESS_KEY para usar el almacenamiento de evidencia."
        )

    return boto3.client(
        "s3",
        endpoint_url=settings.STORAGE_ENDPOINT_URL,
        aws_access_key_id=settings.STORAGE_ACCESS_KEY_ID,
        aws_secret_access_key=settings.STORAGE_SECRET_ACCESS_KEY,
        region_name="auto",  # R2 no usa regiones tipo AWS
        config=Config(s3={"addressing_style": "path"}),
    )


def _slug(texto: str) -> str:
    normalizado = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return "-".join(normalizado.lower().split())


def _nombre_seguro(nombre: str) -> str:
    return "".join(c if c.isalnum() or c in "._-" else "_" for c in nombre)


def extension(nombre_archivo: str) -> str:
    return "." + nombre_archivo.rsplit(".", 1)[-1].lower() if "." in nombre_archivo else ""


def construir_key(entrega, nombre_archivo: str) -> str:
    """Distribucion / Entidad / Dia / Unidad -- estructura acordada para que
    el bucket sea navegable/descargable con ese orden desde fuera."""
    visita = entrega.programacion_visita
    jornada = visita.jornada
    entidad = visita.unidad_medica.entidad
    dia = (entrega.fecha_entrega or date.today()).isoformat()
    sufijo = uuid.uuid4().hex[:8]
    return (
        f"evidencias/{jornada.id}_{_slug(jornada.nombre)}/{_slug(entidad.nombre)}/"
        f"{dia}/{visita.unidad_medica_id}/{sufijo}__{_nombre_seguro(nombre_archivo)}"
    )


def _ruta_local(key: str) -> Path:
    raiz = Path(settings.MEDIA_ROOT).resolve()
    ruta = (raiz / key).resolve()
    if raiz not in ruta.parents:
        raise ValueError("Ruta de evidencia no válida.")
    return ruta


def subir_evidencia(archivo, key: str) -> None:
    if _usa_almacen_local():
        ruta = _ruta_local(key)
        ruta.parent.mkdir(parents=True, exist_ok=True)
        with ruta.open("wb") as destino:
            partes = archivo.chunks() if hasattr(archivo, "chunks") else iter(lambda: archivo.read(64 * 1024), b"")
            for parte in partes:
                destino.write(parte)
        return

    cliente = _cliente_s3()
    cliente.upload_fileobj(
        archivo, settings.STORAGE_BUCKET_NAME, key,
        ExtraArgs={"ContentType": archivo.content_type or "application/octet-stream"},
    )


def generar_url_descarga(key: str, expira_segundos: int = 300) -> str:
    if _usa_almacen_local():
        return f"{settings.MEDIA_URL.rstrip('/')}/{quote(key, safe='/')}"

    cliente = _cliente_s3()
    return cliente.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.STORAGE_BUCKET_NAME, "Key": key},
        ExpiresIn=expira_segundos,
    )


def eliminar_evidencia(key: str) -> None:
    if _usa_almacen_local():
        _ruta_local(key).unlink(missing_ok=True)
        return

    cliente = _cliente_s3()
    cliente.delete_object(Bucket=settings.STORAGE_BUCKET_NAME, Key=key)


def descargar_evidencia(key: str) -> bytes:
    """Trae el archivo completo a memoria -- para insertarlo en el .pptx de
    evidencia (generar_url_descarga sirve para que el navegador lo pida
    directo a R2, esto es para cuando el propio backend necesita los bytes)."""
    if _usa_almacen_local():
        return _ruta_local(key).read_bytes()

    cliente = _cliente_s3()
    respuesta = cliente.get_object(Bucket=settings.STORAGE_BUCKET_NAME, Key=key)
    return respuesta["Body"].read()
