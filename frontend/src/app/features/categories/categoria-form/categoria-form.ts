// src/app/features/categories/components/categoria-form/categoria-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Para directivas como *ngIf, ngClass
import { CategoriaService } from '../../categories/categoria';
import { ICategoria } from '../../categories/models/categoria.model';
import { ToastrService } from 'ngx-toastr'; // ¡Importamos ToastrService!
import { OpenaiApiService } from '../../../core/services/openai-api'; // <<<<< NUEVO: Importar el nuevo servicio

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './categoria-form.html',
  styleUrls: ['./categoria-form.css']
})
export class CategoriaFormComponent implements OnInit {
  categoriaForm!: FormGroup;
  isEditMode: boolean = false;
  categoriaId: string | null = null;
  isLoading: boolean = false;
  loadingData: boolean = true;

  imageGenerationLoading: boolean = false;
  generatedImageUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    // private http: HttpClient // <<<<< ELIMINAR ESTA INYECCIÓN
    private openaiApiService: OpenaiApiService // <<<<< NUEVO: Inyectar el nuevo servicio
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.categoriaId = params.get('id');
      if (this.categoriaId) {
        this.isEditMode = true;
        this.loadCategoria(this.categoriaId);
      } else {
        this.loadingData = false;
      }
    });
  }

  initForm(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      imagen: [''],
      estado: [true, Validators.required],
      imagePrompt: ['']
    });
  }

  loadCategoria(id: string): void {
    this.isLoading = true;
    this.loadingData = true;
    this.categoriaService.getCategoriaById(id).subscribe({
      next: (categoria) => {
        this.categoriaForm.patchValue(categoria);
        this.isLoading = false;
        this.loadingData = false;
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al cargar los datos de la categoría.';
        this.toastr.error(msg, 'Error de Carga');
        this.isLoading = false;
        this.loadingData = false;
        console.error('Error al cargar categoría:', err);
        this.router.navigate(['/admin/categorias']);
      }
    });
  }

  generateImage(): void {
    const prompt = this.categoriaForm.get('imagePrompt')?.value;

    if (!prompt) {
      this.toastr.warning('Por favor, ingresa una descripción (prompt) para generar la imagen.', 'Prompt Requerido');
      return;
    }

    this.imageGenerationLoading = true;
    this.generatedImageUrl = null;

    // >>>>>>>>>>>>>> CAMBIO AQUÍ: Usar openaiApiService <<<<<<<<<<<<<<<
    this.openaiApiService.generateImage(prompt).subscribe({
      next: (res) => {
        this.generatedImageUrl = res.imageUrl;
        this.toastr.success('Imagen generada exitosamente. Revísala abajo y úsala si te gusta.', 'Éxito');
        this.imageGenerationLoading = false;
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error al generar la imagen.';
        this.toastr.error(msg, 'Error de Generación de Imagen');
        this.imageGenerationLoading = false;
        console.error('Error al generar imagen:', err);
      }
    });
    // >>>>>>>>>>>>>> FIN CAMBIO <<<<<<<<<<<<<<<
  }

  useGeneratedImage(): void {
    if (this.generatedImageUrl) {
      this.categoriaForm.get('imagen')?.setValue(this.generatedImageUrl);
      this.toastr.info('La URL de la imagen generada ha sido asignada al campo de imagen.', 'Imagen Asignada');
    } else {
      this.toastr.warning('No hay una imagen generada para usar.', 'Advertencia');
    }
  }

  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      this.toastr.warning('Por favor, completa todos los campos requeridos.', 'Formulario Inválido');
      return;
    }

    this.isLoading = true;
    const { imagePrompt, ...categoriaData } = this.categoriaForm.value;

    if (this.isEditMode && this.categoriaId) {
      this.categoriaService.updateCategoria(this.categoriaId, categoriaData).subscribe({
        next: (res) => {
          this.toastr.success(res.mensaje || 'Categoría actualizada exitosamente.', 'Actualización Exitosa');
          this.isLoading = false;
          this.router.navigate(['/admin/categorias']);
        },
        error: (err) => {
          const msg = err.error?.mensaje || 'No se pudo actualizar la categoría.';
          this.toastr.error(msg, 'Error de Actualización');
          this.isLoading = false;
          console.error('Error al actualizar categoría:', err);
        }
      });
    } else {
      this.categoriaService.createCategoria(categoriaData).subscribe({
        next: (res) => {
          this.toastr.success(res.mensaje || 'Categoría creada exitosamente.', 'Creación Exitosa');
          this.isLoading = false;
          this.router.navigate(['/admin/categorias']);
        },
        error: (err) => {
          const msg = err.error?.mensaje || 'No se pudo crear la categoría.';
          this.toastr.error(msg, 'Error de Creación');
          this.isLoading = false;
          console.error('Error al crear categoría:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/categorias']);
  }
}