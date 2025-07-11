# Sistema de Home - Restaurante Subte

## Descripción General

El sistema de Home implementa una página de inicio completa para un restaurante/cafetería con navegación por categorías, visualización de productos, combos y ofertas, integrado completamente con el backend existente.

## Estructura de Componentes

### 1. Home (Componente Principal)
- **Ubicación**: `src/app/features/cliente/pages/home/`
- **Responsabilidades**:
  - Manejo del estado principal de la aplicación
  - Control de navegación entre secciones (Categorías, Combos, Ofertas)
  - Carga de datos desde el backend
  - Manejo de estados de carga y errores
  - Integración con el servicio de carrito

### 2. MainNavigation
- **Ubicación**: `src/app/features/cliente/pages/components/main-navigation/`
- **Responsabilidades**:
  - Navegación principal entre secciones
  - Botones: Categorías, Combos, Ofertas
  - Indicadores de estado activo y carga

### 3. CategoryTabs
- **Ubicación**: `src/app/features/cliente/pages/components/category-tabs/`
- **Responsabilidades**:
  - Visualización de categorías de productos
  - Selección de categoría activa
  - Skeleton loading para mejor UX

### 4. ProductGrid
- **Ubicación**: `src/app/features/cliente/pages/components/product-grid/`
- **Responsabilidades**:
  - Grid responsive de productos
  - Skeleton loading para productos
  - Estados vacíos cuando no hay datos

### 5. ProductCard
- **Ubicación**: `src/app/features/cliente/pages/components/product-card/`
- **Responsabilidades**:
  - Tarjeta individual de producto
  - Información: imagen, nombre, descripción, precio
  - Botón "Agregar al carrito"
  - Efectos hover y animaciones

## Servicios Integrados

### Servicios del Backend
- **ProductoService**: Gestión de productos
- **CategoriaService**: Gestión de categorías
- **ComboService**: Gestión de combos
- **OfertaService**: Gestión de ofertas

### Servicios del Frontend
- **CartService**: Manejo del carrito de compras
  - Agregar/eliminar productos
  - Calcular totales
  - Persistencia en localStorage

## Funcionalidades Implementadas

### 1. Navegación por Secciones
- **Categorías**: Muestra productos organizados por categorías
- **Combos**: Muestra combos especiales con descuentos
- **Ofertas**: Muestra ofertas del día

### 2. Filtrado de Productos
- Carga automática de productos por categoría
- Filtrado de productos disponibles
- Selección automática de primera categoría

### 3. Estados de Carga
- Loading global durante carga inicial
- Loading específico por sección
- Skeleton loading para mejor UX
- Estados vacíos informativos

### 4. Manejo de Errores
- Captura de errores HTTP
- Mensajes de error amigables
- Botón de reintento
- Fallback para imágenes

### 5. Carrito de Compras
- Agregar productos al carrito
- Persistencia en localStorage
- Cálculo automático de totales
- Gestión de cantidades

### 6. Diseño Responsive
- Mobile-first approach
- Grid adaptativo
- Breakpoints: 480px, 768px, 1200px
- Soporte para modo oscuro

## Interfaces de Datos

### MainButton
```typescript
interface MainButton {
  name: string;
  active: boolean;
  key: 'categorias' | 'combos' | 'ofertas';
}
```

### HomeState
```typescript
interface HomeState {
  isLoading: boolean;
  isLoadingCategories: boolean;
  isLoadingProducts: boolean;
  isLoadingCombos: boolean;
  isLoadingOfertas: boolean;
  errorMessage: string;
  hasError: boolean;
  categories: any[];
  products: any[];
  filteredProducts: any[];
  combos: any[];
  ofertas: any[];
  activeSection: 'categorias' | 'combos' | 'ofertas';
  selectedCategoryId: string | null;
}
```

## Flujo de Datos

### 1. Inicialización
1. Home carga categorías activas
2. Selecciona primera categoría por defecto
3. Carga productos de la categoría seleccionada
4. Actualiza estado de componentes hijos

### 2. Navegación
1. Usuario selecciona sección (Categorías/Combos/Ofertas)
2. Home actualiza estado de navegación
3. Carga datos correspondientes si no están disponibles
4. Actualiza productos mostrados

### 3. Filtrado por Categoría
1. Usuario selecciona categoría
2. Home actualiza categoría seleccionada
3. Carga productos de la nueva categoría
4. Filtra productos disponibles

### 4. Agregar al Carrito
1. Usuario hace click en "Agregar"
2. ProductCard emite evento addToCart
3. ProductGrid propaga evento
4. Home recibe evento y llama CartService
5. CartService actualiza carrito y localStorage

## Características de UX/UI

### 1. Animaciones
- Fade in para secciones
- Hover effects en tarjetas
- Transiciones suaves
- Loading spinners

### 2. Estados Visuales
- Loading states con skeleton
- Error states con retry
- Empty states informativos
- Success feedback

### 3. Accesibilidad
- Focus management
- Keyboard navigation
- Screen reader support
- Reduced motion support

### 4. Performance
- Lazy loading de imágenes
- Optimizaciones CSS
- Memory leak prevention
- Efficient re-renders

## Configuración y Uso

### 1. Rutas
El componente está configurado en:
```typescript
{
  path: 'home',
  loadComponent: () => import('./features/cliente/pages/home/home').then(m => m.Home)
}
```

### 2. Dependencias
- Angular Common
- RxJS para manejo de observables
- Servicios HTTP existentes
- Interfaces compartidas

### 3. Estilos
- CSS moderno con variables
- Grid CSS para layout
- Flexbox para componentes
- Media queries para responsive

## Mejoras Futuras

### 1. Funcionalidades Adicionales
- Búsqueda de productos
- Filtros avanzados
- Wishlist
- Historial de pedidos

### 2. Optimizaciones
- Virtual scrolling para muchos productos
- Image optimization
- Service worker para cache
- PWA features

### 3. Integración Backend
- WebSockets para stock en tiempo real
- Push notifications
- Analytics tracking
- A/B testing

## Troubleshooting

### Problemas Comunes

1. **Imágenes no cargan**
   - Verificar URLs en el backend
   - Revisar CORS configuration
   - Check fallback images

2. **Datos no se cargan**
   - Verificar endpoints del backend
   - Revisar autenticación
   - Check network connectivity

3. **Carrito no persiste**
   - Verificar localStorage
   - Check browser permissions
   - Review CartService implementation

### Debug Tips
- Usar console.log en métodos clave
- Revisar Network tab en DevTools
- Verificar estado de observables
- Check Angular DevTools extension 