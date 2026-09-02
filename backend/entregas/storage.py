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
from io import BytesIO

from django.conf import settings

MAX_EVIDENCIA_BYTES = 15 * 1024 * 1024  # 15MB -- fotos de celular pesan mas que un PDF

# Extension (en minusculas) -> tipo de EvidenciaArchivo.TIPO_CHOICES.
EXTENSION_A_TIPO = {
    ".jpg": "foto", ".jpeg": "foto", ".png": "foto", ".heic": "foto",
    ".heif": "foto", ".webp": "foto",
    ".mp4": "video", ".mov": "video",
    ".pdf": "pdf",
    ".doc": "documento", ".docx": "documento",
}


def _cliente_s3():
    from botocore.client import Config
    import boto3

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


# JPG/PNG los acepta python-pptx directo (ext_map de
# pptx/parts/image.py). Cualquier otro formato de imagen que se acepte
# subir -- HEIC/HEIF (Pillow no los puede ni abrir sin el plugin) y
# tambien WEBP (Pillow SI lo abre, pero python-pptx lo rechaza igual:
# "unsupported image format, expected one of: BMP, GIF, JPEG, PNG,
# TIFF, WMF" -- limite propio de python-pptx, no de Pillow) -- se
# convierte a JPEG.
_EXTENSIONES_IMAGEN_SEGURAS = {".jpg", ".jpeg", ".png"}


def convertir_formato_no_soportado_si_aplica(archivo, nombre_archivo: str):
    """Convierte a JPEG cualquier imagen subida en un formato que
    python-pptx no acepte insertar en una diapositiva (ver arriba) --
    una sola vez, al subir, para que la foto funcione despues en todos
    lados (vista previa, presentacion) sin tener que resolver esto en
    cada lugar donde se usa la imagen. Si ya es JPG/PNG, regresa lo
    mismo sin tocar."""
    if extension(nombre_archivo) in _EXTENSIONES_IMAGEN_SEGURAS:
        return archivo, nombre_archivo

    import pillow_heif
    from PIL import Image

    # No-op si el archivo no es HEIC/HEIF -- solo le enseña a Pillow a
    # abrir ese formato tambien, no afecta la lectura de otros.
    pillow_heif.register_heif_opener()
    imagen = Image.open(archivo).convert("RGB")
    salida = BytesIO()
    imagen.save(salida, format="JPEG", quality=88)
    salida.seek(0)
    salida.content_type = "image/jpeg"
    nombre_nuevo = nombre_archivo.rsplit(".", 1)[0] + ".jpg"
    return salida, nombre_nuevo


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


def subir_evidencia(archivo, key: str) -> None:
    cliente = _cliente_s3()
    cliente.upload_fileobj(
        archivo, settings.STORAGE_BUCKET_NAME, key,
        ExtraArgs={"ContentType": archivo.content_type or "application/octet-stream"},
    )


def generar_url_descarga(key: str, expira_segundos: int = 300) -> str:
    cliente = _cliente_s3()
    return cliente.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.STORAGE_BUCKET_NAME, "Key": key},
        ExpiresIn=expira_segundos,
    )


def eliminar_evidencia(key: str) -> None:
    cliente = _cliente_s3()
    cliente.delete_object(Bucket=settings.STORAGE_BUCKET_NAME, Key=key)


def descargar_evidencia(key: str) -> bytes:
    """Trae el archivo completo a memoria -- para insertarlo en el .pptx de
    evidencia (generar_url_descarga sirve para que el navegador lo pida
    directo a R2, esto es para cuando el propio backend necesita los bytes)."""
    cliente = _cliente_s3()
    respuesta = cliente.get_object(Bucket=settings.STORAGE_BUCKET_NAME, Key=key)
    return respuesta["Body"].read()
