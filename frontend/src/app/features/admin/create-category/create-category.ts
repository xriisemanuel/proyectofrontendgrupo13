// src/app/features/admin/create-category/create-category.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa la interfaz y el servicio
import { ICategoria } from '../../../shared/interfaces';
import { CategoriaService } from '../../../data/services/categoria';
import { OpenaiApiService } from '../../../core/services/openai-api'; // Importa tu nuevo servicio de OpenAI

@Component({
    selector: 'app-create-category',
    templateUrl: './create-category.html',
    styleUrls: ['./create-category.css'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class CreateCategory implements OnInit, OnDestroy {
    categoryForm: FormGroup;
    isSaving: boolean = false;
    private destroy$ = new Subject<void>();

    // Propiedades para la generación de imágenes
    generatedImageUrl: string | null = null;
    isSearchingImage: boolean = false;
    successMessage: string | null = null;
    errorMessage: string | null = null;

    // Cambiado de UnplashService a OpenaiApiService
    private openaiApiService = inject(OpenaiApiService);

    constructor(
        private fb: FormBuilder,
        private categoriaService: CategoriaService,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.categoryForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            imagen: ['', Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?.(png|jpg|jpeg|gif)')],
            estado: [true, Validators.required],
            imagenPrompt: ['']
        });
    }

    ngOnInit(): void {
        // No hay lógica compleja de inicialización por ahora
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    buscarImagen(): void {
        this.errorMessage = null;
        this.successMessage = null;

        const prompt = this.categoryForm.get('imagenPrompt')?.value;
        if (prompt) {
            this.isSearchingImage = true;
            this.generatedImageUrl = null;
            // Llama a tu OpenaiApiService
            this.openaiApiService.generateImage(prompt).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.isSearchingImage = false;
                    if (response && response.imageUrl) {
                        this.generatedImageUrl = response.imageUrl;
                        this.successMessage = 'Imagen generada con éxito. Puedes usarla o buscar otra.';
                    } else {
                        this.errorMessage = 'No se pudo generar una imagen para el prompt proporcionado.';
                        this.toastr.info('No se pudo generar una imagen para el prompt proporcionado.', 'Sin Resultados');
                    }
                },
                error: (err) => {
                    this.isSearchingImage = false;
                    console.error('Error al generar imagen con OpenAI:', err);
                    this.errorMessage = 'Error al generar la imagen. Por favor, intenta de nuevo.';
                    this.toastr.error(this.errorMessage, 'Error de Generación');
                }
            });
        } else {
            this.errorMessage = 'Por favor, introduce una descripción para generar una imagen.';
            this.toastr.warning(this.errorMessage, 'Descripción Requerida');
        }
    }

    usarImagenGenerada(): void {
        if (this.generatedImageUrl) {
            this.categoryForm.get('imagen')?.setValue(this.generatedImageUrl);
            this.toastr.success('URL de la imagen generada copiada al campo "URL de la Imagen".', 'Imagen Agregada');
            this.generatedImageUrl = null;
        } else {
            this.toastr.warning('No hay ninguna imagen generada para usar.', 'Sin Imagen');
        }
    }

    onSubmit(): void {
        this.isSaving = true;
        this.errorMessage = null;
        this.successMessage = null;

        if (this.categoryForm.invalid) {
            this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
            this.categoryForm.markAllAsTouched();
            this.isSaving = false;
            return;
        }

        const newCategoryData: Partial<ICategoria> = this.categoryForm.value;
        console.log('Intentando crear categoría:', newCategoryData);

        this.categoriaService.createCategoria(newCategoryData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.successMessage = response.mensaje || 'Categoría creada exitosamente.';
                this.toastr.success(this.successMessage || 'Categoría creada exitosamente.', '¡Éxito!');
                this.categoryForm.reset({ estado: true });
                this.generatedImageUrl = null;
                this.isSaving = false;
                setTimeout(() => {
                    this.router.navigate(['/admin/categories']);
                }, 1500);
            },
            error: (err) => {
                console.error('Error al crear la categoría:', err);
                const errorMessage = err.error?.mensaje || 'Error al crear la categoría. Por favor, intente de nuevo.';
                this.errorMessage = errorMessage;
                this.toastr.error(errorMessage, 'Error de Creación');
                this.isSaving = false;
            }
        });
    }

    get f() { return this.categoryForm.controls; }
}