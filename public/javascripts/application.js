// Correct widths and heights based on window size
function resize() {
    $('.main-pane').css({
        'height': $('.main-pane').height()
    });
    console.log($('.main-pane').height());
};

function test() {    
    var height = $(window).height() - $('#header').height() - 1,
        width = $('.content').width(),
        ov = $('.outline-view'),
        ed = $('#editor'),
        toolbar = $('.toolbar'),
        divider = $('.content-divider'),
        content = $('.content'),
        controls = $('#controls');

    $('#DocumentTitles').css({ height: height - toolbar.height() + 'px' });
    ov.css({ height: height + 'px' });
    toolbar.css({ width: ov.width() + 'px' });

    content.css({
        height: height - controls.height() + 'px',
        width: $('body').width() - ov.width() - divider.width() - 1 + 'px'
    });

    divider.css({ height: height + 'px' });

    ed.css({
        width: content.width() - 5 + 'px',
        height: content.height() - 5 + 'px'
    }).focus();

    $('#controls').css({
        width: content.width() + 'px'
    });
}

$('#document-list li a').live('click', function(e) {
    var li = $(this).parent();

    $.get(this.href + '.json', function(data) {
        $('#document-list .active').removeClass('active');
        li.addClass('active');
        $('#editor').val(data.data);
        $('#editor').focus();
    });

    e.preventDefault();
});

if ($('#document-list .active').length == 0) {
    $('#document-list li a').first().click();
}

$('#save-button').click(function() {
    var id = $('#document-list .active').children().attr('id');
    params = { document: { data: $('#editor').val(), id: id } };
    $.ajax( {
        url: '/documents/' + id + '.json',
        type: 'put',
        data: params,
        success: function() {
            //nothing to do here, we already have the data
        }
    });
});

$('#delete-document').live('click', function(e) {
    var el = $('#document-list .active');

    $.ajax( {
        url: '/documents/' + el.children().attr('id'),
        type: 'delete',
        success: function() {
            el.remove();
            $('#document-list li a').first().click();
        }
    });
});

//$(window).resize(resize);
//$(window).focus(resize);
//resize();
