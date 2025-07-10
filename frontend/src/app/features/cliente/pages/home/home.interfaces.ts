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
  categories: any[];
  products: any[];
  filteredProducts: any[];
  combos: any[];
  ofertas: any[];
  
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
  products: any[];
  total: number;
}

export interface CategoriesResponse {
  categories: any[];
} 