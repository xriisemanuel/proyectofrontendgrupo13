// Interfaces específicas para el componente Home

export interface MainButton {
  name: string;
  active: boolean;
  key: 'categorias' | 'combos' | 'ofertas';
}

export interface HomeState {
  // Estados de carga
  isLoading: boolean;
  isLoadingCategories: boolean;
  isLoadingProducts: boolean;
  isLoadingCombos: boolean;
  isLoadingOfertas: boolean;

  // Estados de error
  errorMessage: string;
  hasError: boolean;

  // Estados de datos
  categories: unknown[];
  products: unknown[];
  filteredProducts: unknown[];
  combos: unknown[];
  ofertas: unknown[];
  
  // Estados de navegación
  activeSection: 'categorias' | 'combos' | 'ofertas';
  selectedCategoryId: string | null;
}

// Interfaces para respuestas del backend
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface ProductsResponse {
  products: unknown[];
  total: number;
}

export interface CategoriesResponse {
  categories: unknown[];
} 