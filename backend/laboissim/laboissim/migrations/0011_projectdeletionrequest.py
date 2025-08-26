# Generated manually for ProjectDeletionRequest model

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('laboissim', '0010_project_funding_amount_project_funding_company'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectDeletionRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField(help_text='Reason for requesting project deletion')),
                ('admin_notes', models.TextField(blank=True, help_text='Admin notes on approval/rejection', null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deletion_requests', to='laboissim.project')),
                ('requested_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deletion_requests', to=settings.AUTH_USER_MODEL)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_deletions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-requested_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='projectdeletionrequest',
            constraint=models.CheckConstraint(check=models.Q(status__in=['pending', 'approved', 'rejected']), name='valid_deletion_status'),
        ),
    ]
