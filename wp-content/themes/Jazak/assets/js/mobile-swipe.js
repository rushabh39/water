// Global Touch & Swipe Gesture Controller for Sliders
(function() {
    var startX = 0;
    var startY = 0;
    var activeSlider = null;

    document.addEventListener('touchstart', function(e) {
        var slider = e.target.closest('.js-slider');
        if (slider && e.touches && e.touches.length === 1) {
            activeSlider = slider;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!activeSlider) return;
        if (e.changedTouches && e.changedTouches.length === 1) {
            var diffX = e.changedTouches[0].clientX - startX;
            var diffY = e.changedTouches[0].clientY - startY;
            var slider = activeSlider;
            activeSlider = null;

            // Trigger if horizontal movement is dominant and > 30px
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
                if (diffX < 0) {
                    var next = slider.querySelector('.js-slider-right');
                    if (next) next.click();
                } else {
                    var prev = slider.querySelector('.js-slider-left');
                    if (prev) prev.click();
                }
            }
        }
    }, { passive: true });
})();
