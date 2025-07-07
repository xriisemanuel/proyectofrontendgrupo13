// src/app/utils/star-rating-pure-js.js

/**
 * Inicializa un componente de calificación por estrellas en un elemento HTML.
 * @param {string} containerId - El ID del elemento contenedor donde se renderizarán las estrellas.
 * @param {number} initialRating - La puntuación inicial (1-5).
 * @param {boolean} readonly - Si las estrellas deben ser de solo lectura.
 * @param {string} eventName - El nombre del evento personalizado a disparar cuando la puntuación cambie.
 */
function initializeStarRating(containerId, initialRating = 0, readonly = false, eventName = 'ratingChange') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Star rating container with ID '${containerId}' not found.`);
        return;
    }

    const maxStars = 5;
    let currentRating = initialRating;

    // Limpiar contenido existente para evitar duplicados si se llama varias veces
    container.innerHTML = '';

    // Función para renderizar las estrellas
    function renderStars() {
        container.innerHTML = ''; // Limpiar estrellas antes de renderizar
        for (let i = 1; i <= maxStars; i++) {
            const star = document.createElement('span');
            star.classList.add('star');
            star.dataset.value = i; // Almacena el valor de la estrella
            star.innerHTML = '&#9733;'; // Carácter Unicode de estrella ★

            if (i <= currentRating) {
                star.classList.add('filled');
            } else {
                star.classList.add('empty');
            }

            if (readonly) {
                star.classList.add('readonly');
            } else {
                // Añadir listeners solo si no es de solo lectura
                star.addEventListener('click', (event) => {
                    currentRating = i;
                    renderStars(); // Re-renderiza para actualizar el estado visual
                    // Dispara un evento personalizado para que Angular pueda escucharlo
                    const customEvent = new CustomEvent(eventName, {
                        detail: { rating: currentRating, containerId: containerId }
                    });
                    container.dispatchEvent(customEvent);
                });
                // Opcional: Efecto hover
                star.addEventListener('mouseenter', () => {
                    if (!readonly) {
                        Array.from(container.children).forEach((s, idx) => {
                            if (idx < i) {
                                s.classList.add('hover-filled');
                            } else {
                                s.classList.remove('hover-filled');
                            }
                        });
                    }
                });
                star.addEventListener('mouseleave', () => {
                    if (!readonly) {
                        Array.from(container.children).forEach(s => s.classList.remove('hover-filled'));
                    }
                });
            }
            container.appendChild(star);
        }
    }

    // Renderizar las estrellas inicialmente
    renderStars();
}

// Para que la función sea accesible globalmente o exportable
// En un entorno de navegador, puedes adjuntarlo a window
window.initializeStarRating = initializeStarRating;
