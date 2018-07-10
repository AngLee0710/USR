<% if(error) {%>
    alert('<%= error %>');
<% } %>
$('#input2').on('change', () => {
    var text = '';

    switch($('#input2').val()) {
        case 'S':
            text = '學號：';
            break;
        case 'T':
            text = '教職員編號：';
            break;
        case 'O':
            text = '信箱：';
            break;
    }
    $('#input3_text').text(text);
});