$('.destroy').live('click', function(e) {
    e.preventDefault();

    //if(confirm('Are you sure you want to delete that item?')) {
        var url = $(this).attr('href');
        var el = $(this);
        $.ajax( {
            url: url,
            type: 'delete',
            success: function() {
                el.parents('li').first().remove();
            }
        });
    //}
});

$('#logout').live('click', function(e) {
    setTimeout(function() { window.location.href = '/sessions/new'; }, 150);
});