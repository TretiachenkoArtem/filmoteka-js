document.addEventListener('DOMContentLoaded', () => {
    // 1. Логика мобильного меню
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Логика кнопки Filters
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filtersPanel = document.getElementById('filtersPanel');

    if (filterToggleBtn && filtersPanel) {
        filterToggleBtn.addEventListener('click', () => {
            filtersPanel.classList.toggle('active');
            
            // На десктопе кнопка может скрывать панель полностью
            if (window.innerWidth > 900) {
                if (filtersPanel.style.display === 'none') {
                    filtersPanel.style.display = 'flex';
                } else {
                    filtersPanel.style.display = 'none';
                }
            }
        });
    }

    function toggleSidebar() {
        if(menuBtn && sidebar && overlay) {
            menuBtn.classList.toggle('open');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    }

    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    // 2. Логика перемещения строки поиска (Адаптив)
    const searchForm = document.getElementById('searchForm');
    const desktopSlot = document.getElementById('desktopSearchSlot');
    const mobileSlot = document.getElementById('mobileSearchSlot');

    function arrangeSearchBox() {
        if (!searchForm || !desktopSlot || !mobileSlot) return;
        
        // Переносим поиск в боковое меню на экранах <= 900px
        if (window.innerWidth <= 900) {
            if (mobileSlot.children.length === 0) {
                mobileSlot.appendChild(searchForm);
            }
        } else {
            // Возвращаем поиск в шапку на больших экранах
            if (desktopSlot.children.length === 0) {
                desktopSlot.appendChild(searchForm);
                // Если меню было открыто (через гамбургер), закрываем его при расширении окна
                if (sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
        }
    }

    arrangeSearchBox();
    window.addEventListener('resize', arrangeSearchBox);
});