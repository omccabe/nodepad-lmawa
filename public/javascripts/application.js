// Correct widths and heights based on window size
function resize() {
    var height = $(window).height() - $('.navbar').height() - 100;

    $('#document-titles').css({
        'height'   : height,
        'position' : 'relative',
        'top'      : '9px'
    });
    $('#editor').css({
        'height': height
    });
};

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

$(window).resize(resize);
resize();
