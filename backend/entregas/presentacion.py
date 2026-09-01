"""Genera la presentacion de PowerPoint de evidencia fotografica a partir
de la plantilla real (entregas/plantillas/Formato_rutas.pptx, copia de
docs/Formato_rutas.pptx). Ver el plan de esta funcion para el detalle de
por que se hace asi -- resumen: pptxgenjs (el generador anterior, en el
navegador) no puede abrir un .pptx existente, asi que esto se hace en el
backend con python-pptx, que si puede editar/clonar diapositivas reales
conservando el diseno (logos, fondo institucional, colores) tal cual.

Duplicar una diapositiva no es una funcion nativa de python-pptx -- se
hace copiando el arbol de formas de la diapositiva origen hacia una
diapositiva nueva (creada con el mismo layout, que ya trae el fondo/logos
solos por venir del layout) y volviendo a relacionar cualquier imagen que
se copie sin cambios: las relaciones (rId) son por diapositiva, copiar el
XML de una forma no copia sus relaciones.
"""

import copy
import io
from pathlib import Path

from pptx import Presentation
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.oxml.ns import qn

from . import storage
from .regiones import orden_regiones, region_de

RUTA_PLANTILLA = Path(__file__).resolve().parent / "plantillas" / "Formato_rutas.pptx"

_NS_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# IDs de forma (p:cNvPr id=) en la diapositiva 3 de la plantilla -- cada
# tupla es (rectangulo con la foto, cuadro de texto con la leyenda), en el
# orden en que se deben llenar. Confirmados abriendo la plantilla con
# python-pptx antes de escribir este archivo (ver el plan).
_SLOTS_FOTO = [
    (24, 2), (26, 25), (28, 27), (30, 29),
    (32, 31), (34, 33), (36, 35), (38, 37),
]
_ID_TITULO_ENTIDAD = 9
_ID_DIA_CONTENIDO = 11
_ID_DIA_PORTADA = 3
_ID_TITULO_REGION = 2


def _texto_forma(forma, texto_nuevo):
    """Cambia el texto de una forma preservando el formato (fuente, tamano,
    color) del primer run -- reemplazar text_frame.text de un jalon lo
    resetea a la fuente por default."""
    parrafo = forma.text_frame.paragraphs[0]
    if not parrafo.runs:
        parrafo.add_run()
    parrafo.runs[0].text = texto_nuevo
    for run_extra in parrafo.runs[1:]:
        run_extra.text = ""


def _texto_leyenda(forma, nombre_unidad, clues):
    """La leyenda de cada foto son 2 parrafos separados en la plantilla
    (nombre de la unidad arriba, CLUES abajo) -- no una sola linea."""
    parrafos = forma.text_frame.paragraphs
    for parrafo, texto in zip(parrafos, [nombre_unidad, clues]):
        if not parrafo.runs:
            parrafo.add_run()
        parrafo.runs[0].text = texto
        for run_extra in parrafo.runs[1:]:
            run_extra.text = ""


def _forma_por_id(diapositiva, shape_id):
    for forma in diapositiva.shapes:
        if forma.shape_id == shape_id:
            return forma
    raise ValueError(f"No se encontro la forma id={shape_id} en la diapositiva -- "
                      "revisar si la plantilla Formato_rutas.pptx cambio de estructura.")


def _remapear_imagenes(elemento, parte_origen, parte_nueva):
    for nodo in elemento.iter():
        for atributo in ("embed", "link"):
            rid_viejo = nodo.get(f"{_NS_REL}{atributo}")
            if not rid_viejo:
                continue
            parte_imagen = parte_origen.related_part(rid_viejo)
            rid_nuevo = parte_nueva.relate_to(parte_imagen, RT.IMAGE)
            nodo.set(f"{_NS_REL}{atributo}", rid_nuevo)


def _eliminar_diapositiva(prs, diapositiva):
    """python-pptx no trae 'borrar diapositiva' -- hay que quitar su entrada
    de sldIdLst y soltar la relacion en el part de la presentacion, si no
    el archivo queda con una referencia rota."""
    for id_slide in list(prs.slides._sldIdLst):
        if prs.part.related_part(id_slide.rId) is diapositiva.part:
            prs.part.drop_rel(id_slide.rId)
            prs.slides._sldIdLst.remove(id_slide)
            return


def _duplicar_diapositiva(prs, diapositiva_origen):
    nueva = prs.slides.add_slide(diapositiva_origen.slide_layout)
    # add_slide() trae los placeholders vacios del layout -- no sirven,
    # se quitan antes de copiar encima las formas reales.
    for forma in list(nueva.shapes):
        forma._element.getparent().remove(forma._element)
    for forma_origen in diapositiva_origen.shapes:
        copia = copy.deepcopy(forma_origen._element)
        _remapear_imagenes(copia, diapositiva_origen.part, nueva.part)
        nueva.shapes._spTree.append(copia)
    return nueva


def _reemplazar_foto(forma_rect, bytes_imagen, parte_diapositiva):
    image_part, rid = parte_diapositiva.get_or_add_image_part(io.BytesIO(bytes_imagen))
    blip = forma_rect._element.spPr.find(qn("a:blipFill")).find(qn("a:blip"))
    blip.set(qn("r:embed"), rid)


def _llenar_diapositiva_contenido(diapositiva, entidad_nombre, dia_etiqueta, fotos):
    _texto_forma(_forma_por_id(diapositiva, _ID_TITULO_ENTIDAD), entidad_nombre.title())
    _texto_forma(_forma_por_id(diapositiva, _ID_DIA_CONTENIDO), dia_etiqueta)

    for i, (id_rect, id_texto) in enumerate(_SLOTS_FOTO):
        forma_rect = _forma_por_id(diapositiva, id_rect)
        forma_texto = _forma_por_id(diapositiva, id_texto)
        if i < len(fotos):
            visita = fotos[i]["visita"]
            evidencia = fotos[i]["evidencia"]
            bytes_imagen = storage.descargar_evidencia(evidencia.ruta_almacen)
            _reemplazar_foto(forma_rect, bytes_imagen, diapositiva.part)
            _texto_leyenda(forma_texto, visita.unidad_medica.nombre, visita.unidad_medica_id)
        else:
            forma_rect._element.getparent().remove(forma_rect._element)
            forma_texto._element.getparent().remove(forma_texto._element)


def construir_presentacion(dia_texto, fotos):
    """fotos: lista de {"visita": ProgramacionVisita, "evidencia": EvidenciaArchivo}
    (instancias de modelo reales -- ver views.py, ahi se valida y resuelve
    cada una desde la base antes de llegar aqui). Regresa un BytesIO listo
    para mandar como respuesta binaria."""
    prs = Presentation(str(RUTA_PLANTILLA))
    diapositiva_portada = prs.slides[0]
    diapositiva_region_base = prs.slides[1]
    diapositiva_contenido_base = prs.slides[2]

    dia_etiqueta = f"Día 1: {dia_texto}"
    _texto_forma(_forma_por_id(diapositiva_portada, _ID_DIA_PORTADA), dia_etiqueta)

    # Region (orden fijo) -> entidad (orden alfabetico) -> fotos de esa entidad.
    por_region = {}
    for foto in fotos:
        entidad_nombre = foto["visita"].unidad_medica.entidad.nombre
        region = region_de(entidad_nombre)
        por_region.setdefault(region, {}).setdefault(entidad_nombre, []).append(foto)

    # diapositiva_region_base y diapositiva_contenido_base son PLANTILLAS --
    # nunca se editan/mutan directamente (llenar una diapositiva de
    # contenido con menos de 8 fotos borra los slots sobrantes; si eso le
    # pasara a la base, la siguiente copia saldria incompleta). Cada
    # region/entidad, incluida la primera, usa una copia nueva; al final se
    # borran las 2 plantillas, que nunca deben quedar en el resultado.
    for region in orden_regiones():
        entidades = por_region.get(region)
        if not entidades:
            continue

        diapositiva_region = _duplicar_diapositiva(prs, diapositiva_region_base)
        _texto_forma(_forma_por_id(diapositiva_region, _ID_TITULO_REGION), region)

        for entidad_nombre in sorted(entidades):
            fotos_entidad = entidades[entidad_nombre]
            for inicio in range(0, len(fotos_entidad), len(_SLOTS_FOTO)):
                grupo = fotos_entidad[inicio: inicio + len(_SLOTS_FOTO)]
                diapositiva_contenido = _duplicar_diapositiva(prs, diapositiva_contenido_base)
                _llenar_diapositiva_contenido(diapositiva_contenido, entidad_nombre, dia_etiqueta, grupo)

    _eliminar_diapositiva(prs, diapositiva_region_base)
    _eliminar_diapositiva(prs, diapositiva_contenido_base)

    buffer = io.BytesIO()
    prs.save(buffer)
    buffer.seek(0)
    return buffer
