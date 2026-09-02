from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from catalogos.models import Entidad, UnidadMedica
from programacion.models import Jornada, ProgramacionVisita
from usuarios.models import Usuario

from . import storage
from .models import Entrega, EvidenciaArchivo


class AlmacenamientoLocalTest(SimpleTestCase):
	def test_ciclo_completo_sin_r2_en_desarrollo(self):
		with TemporaryDirectory() as media_root, override_settings(
			DEBUG=True,
			MEDIA_ROOT=media_root,
			MEDIA_URL="/media/",
			STORAGE_ENDPOINT_URL=None,
			STORAGE_ACCESS_KEY_ID=None,
			STORAGE_SECRET_ACCESS_KEY=None,
		):
			key = "evidencias/prueba/unidad/archivo de prueba.pdf"
			archivo = SimpleUploadedFile("archivo.pdf", b"contenido", content_type="application/pdf")

			storage.subir_evidencia(archivo, key)

			ruta = Path(media_root) / key
			self.assertTrue(ruta.exists())
			self.assertEqual(storage.descargar_evidencia(key), b"contenido")
			self.assertEqual(
				storage.generar_url_descarga(key),
				"/media/evidencias/prueba/unidad/archivo%20de%20prueba.pdf",
			)

			storage.eliminar_evidencia(key)
			self.assertFalse(ruta.exists())


class SubidaEvidenciaApiTest(APITestCase):
	def setUp(self):
		self.usuario = Usuario.objects.create_user(
			username="prueba@imssbienestar.gob.mx",
			password="password-de-prueba",
			rol=Usuario.ROL_SUPER_ADMIN,
		)
		entidad = Entidad.objects.create(nombre="ENTIDAD DE PRUEBA")
		unidad = UnidadMedica.objects.create(
			clues="TEST000001",
			nombre="UNIDAD DE PRUEBA",
			entidad=entidad,
			nivel_atencion=UnidadMedica.NIVEL_PRIMER,
		)
		jornada = Jornada.objects.create(
			nombre="Distribución de prueba",
			tipo=Jornada.TIPO_ORDINARIA,
			categoria=Jornada.CATEGORIA_PRIMER_NIVEL,
			fecha_inicio="2026-09-01",
			fecha_fin="2026-09-02",
		)
		visita = ProgramacionVisita.objects.create(jornada=jornada, unidad_medica=unidad)
		self.entrega = Entrega.objects.create(programacion_visita=visita, usuario=self.usuario)
		self.client.force_authenticate(self.usuario)

	def test_subir_y_eliminar_evidencia_con_almacen_local(self):
		with TemporaryDirectory() as media_root, override_settings(
			DEBUG=True,
			MEDIA_ROOT=media_root,
			MEDIA_URL="/media/",
			STORAGE_ENDPOINT_URL=None,
			STORAGE_ACCESS_KEY_ID=None,
			STORAGE_SECRET_ACCESS_KEY=None,
		):
			archivo = SimpleUploadedFile("comprobante.pdf", b"contenido", content_type="application/pdf")
			respuesta = self.client.post(
				reverse("entrega-subir-evidencia", args=[self.entrega.id]),
				{"file": archivo},
				format="multipart",
			)

			self.assertEqual(respuesta.status_code, 201, respuesta.data)
			evidencia = EvidenciaArchivo.objects.get(pk=respuesta.data["id"])
			ruta = Path(media_root) / evidencia.ruta_almacen
			self.assertTrue(ruta.exists())
			self.assertTrue(respuesta.data["url_descarga"].startswith("http://testserver/media/"))

			respuesta = self.client.delete(reverse("evidenciaarchivo-detail", args=[evidencia.id]))
			self.assertEqual(respuesta.status_code, 204)
			self.assertFalse(ruta.exists())
			self.assertFalse(EvidenciaArchivo.objects.filter(pk=evidencia.id).exists())
