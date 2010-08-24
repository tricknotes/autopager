/* 
 * 自動ページ送り機能をサポートするjQueryプラグイン
 *
 * @author tricknotes
 *   
 */

// AutoPagerプラグイン
(function($, window) {
    // PageMarker
    var createPageMarker = function(num) {
        var pageNumber = num || 1;
        return {
            update: function() {
                pageNumber = pageNumber + 1;
            },
            getPageNumber: function() {
                return pageNumber;
            },
            getNextPageNumber: function() {
                return this.getPageNumber() + 1;
            }
        }
    }

    // PageState
    var createPageState = function(url, page) {
        // TODO /page/2 の形式もサポートすること
        var reg = new RegExp("\\?" + page + "=" + "(\\d)");
        var maches = reg.exec(url);
        var pageNumber = maches && Number(maches[1]);

        var pageMarker = createPageMarker(pageNumber);

        var loading = false;

        return {
            updatePage: pageMarker.update,
            currentPage: pageMarker.getPageNumber,
            nextPage: function() {
                 // ここは抽象化してもよいかも
                 var nextParam = page + "=" + String(pageMarker.getNextPageNumber());
                 var next = $("a[href$=" + nextParam + "]").last();
                 next = next || $("a[href*=" + nextParam + "&]").last();
                 return next.attr("href");
            },
            setLoading: function() {
                loading = true;
            },
            setLoaded: function() {
                loading = false;
            },
            isLoading: function() {
                return loading
            }
        }
    }

    // PageRenderer
    var createPageRenderer = function(renderTo, pageState, callbacks) {
        var emptyFn = function() {};
        callbacks = $.extend({
            afterLoad: emptyFn
        }, callbacks);

        return function() {
            if (pageState.isLoading()) {
                return true;
            }

            var nextPage = pageState.nextPage();
            if (!nextPage) {
                return false;
            }

            pageState.setLoading();
            // エラー時の処理を追加する
            $.get(nextPage , null, function(html) {
                pageState.setLoaded();

                // custom callback
                callbacks.afterLoad();
                pageState.updatePage();

                $(html).appendTo(renderTo);
            });
            return true;
        }
    }

    // 監視開始
    var startObserve = function(node, renderer) {

        // 監視停止
        var stopObserve = function() {
            node.unbind("scroll", renderAction);
            node.unbind("resize", renderAction);
            $(window.document).unbind("scroll", renderAction);
            $(window).unbind("resize", renderAction);
        }

        // TODO 整理する
        var isScrollBar, isEndOfScroll;
        if (node.get(0) === $("body").get(0)) {
            isScrollBar = function() {
               return $(window).height() < node.height();
            }
            isEndOfScroll = function() {
                return  $(window).scrollTop() + $(window).height() > node.height() + 20;
            }
        } else {
            isScrollBar = function() {
                return node.height() < node.attr("scrollHeight");
            }
            isEndOfScroll = function() {
                return node.scrollTop() + node.height() > node.attr("scrollHeight") - 20;
            }
        }

        var renderAction = function(event) {
            if (!isScrollBar() || isEndOfScroll()) {
                if (renderer()) {
                    setTimeout(renderAction, 50);
                } else {
                    stopObserve();
                }
            }
        }

        // イベントの監視対象
        node.scroll(renderAction);
        node.resize(renderAction);
        $(window.document).scroll(renderAction);
        $(window).resize(renderAction);
        $(renderAction);

    }

    // autopaget本体
    $.fn.autopager = function(options) {
        if (this.length === 0) {
            return this;
        }
        
        options = $.extend({
            page: "page",
            callbacks: {}
        }, options);

        var pageState = createPageState(window.location.href, options.page);

        var pageRenderer = createPageRenderer(this, pageState, options.callbacks);

        startObserve(this, pageRenderer);

        return this;
    };

})(jQuery, this);

