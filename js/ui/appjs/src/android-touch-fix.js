// Hack to fix Android L issue where touch events don't get propagated
(function (document, App, Utils) {
    if (App.platform !== 'android' || App.platformVersion < 5) {
        return;
    }
    Utils.ready(function () {
        setTimeout(function () {
            var nodes = [].slice.call(document.body.childNodes);
            nodes.forEach(function (node) {
                document.body.removeChild(node);
            });
            nodes.forEach(function (node) {
                document.body.appendChild(node);
            });
        }, 200);
    });
})(document, App, App._Utils);
