var Orangehill = Orangehill || {};



var context;

Orangehill.Rating = function () {
    var RatingScaleQuestion = $('table[summary="Rating Scale Question"]');
    if (RatingScaleQuestion && context) {

    }
}

Orangehill.CustomDesignRendering = function () {
    var RatingScaleQuestion = $('table[summary="Rating Scale Question"]');
    if (RatingScaleQuestion && context) {

    }
}

Orangehill.init = function () {
    if (!window.jQuery) {
        // jQuery is needed for PnP Responsive UI to run, and is not fully loaded yet, try later
        setTimeout(Orangehill.init, 100);
    } else {
        $('body').addClass("Orangehill");
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            context = SP.ClientContext.get_current();
            Orangehill.CustomDesignRendering();
        });
        
    }
}

Orangehill.init();

