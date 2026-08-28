import django.db.models.deletion
from django.db import migrations, models


NIVELES_POR_CATEGORIA = {
    "primer_nivel": ["PRIMER NIVEL"],
    "segundo_tercer_nivel": ["SEGUNDO NIVEL", "TERCER NIVEL"],
}


def preparar_programacion(apps, schema_editor):
    Jornada = apps.get_model("programacion", "Jornada")
    ProgramacionVisita = apps.get_model("programacion", "ProgramacionVisita")
    UnidadMedica = apps.get_model("catalogos", "UnidadMedica")

    for visita in ProgramacionVisita.objects.select_related("ruta").iterator():
        visita.jornada_id = visita.ruta.jornada_id
        visita.ruta_numero = visita.ruta.numero_o_nombre
        visita.save(update_fields=["jornada", "ruta_numero"])

    for jornada in Jornada.objects.iterator():
        existentes = set(
            ProgramacionVisita.objects.filter(jornada_id=jornada.id).values_list(
                "unidad_medica_id", flat=True
            )
        )
        niveles = NIVELES_POR_CATEGORIA[jornada.categoria]
        unidades = UnidadMedica.objects.filter(nivel_atencion__in=niveles).exclude(
            clues__in=existentes
        )
        ProgramacionVisita.objects.bulk_create(
            [
                ProgramacionVisita(
                    jornada_id=jornada.id,
                    unidad_medica_id=unidad.clues,
                    tipo_unidad_medica=unidad.tipo_unidad_medica,
                )
                for unidad in unidades.iterator()
            ],
            batch_size=500,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("catalogos", "0003_alter_unidadmedica_tipo_unidad_medica"),
        ("programacion", "0002_jornada_categoria"),
    ]

    operations = [
        migrations.AddField(
            model_name="programacionvisita",
            name="jornada",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="visitas",
                to="programacion.jornada",
            ),
        ),
        migrations.AddField(
            model_name="programacionvisita",
            name="ruta_numero",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name="programacionvisita",
            name="fecha_distribucion_programada",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="programacionvisita",
            name="ruta",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="visitas",
                to="programacion.ruta",
            ),
        ),
        migrations.AlterField(
            model_name="programacionvisita",
            name="tipo_unidad_medica",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.RunPython(preparar_programacion, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="programacionvisita",
            name="jornada",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="visitas",
                to="programacion.jornada",
            ),
        ),
        migrations.AlterModelOptions(
            name="programacionvisita",
            options={
                "ordering": ["jornada", "unidad_medica"],
                "verbose_name": "programación de visita",
                "verbose_name_plural": "programaciones de visita",
            },
        ),
        migrations.AddConstraint(
            model_name="programacionvisita",
            constraint=models.UniqueConstraint(
                fields=("jornada", "unidad_medica"),
                name="programacion_jornada_unidad_unica",
            ),
        ),
    ]