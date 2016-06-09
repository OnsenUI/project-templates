(function(){
  'use strict';

  window.app = {};

  app.alertMessage = function(){
      ons.notification.alert('Tapped!');
  };

  app.showDetail = function(index) {
    document.querySelector('#myNavigator').pushPage('detail.html',
      {
        data : {
          itemIndex: index
        }
      }
    );
  };

  var items = [
    {
        title: 'Item 1 Title',
        label: '4h',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
    },
    {
        title: 'Another Item Title',
        label: '6h',
        desc: 'Ut enim ad minim veniam.'
    },
    {
        title: 'Yet Another Item Title',
        label: '1day ago',
        desc: 'Duis aute irure dolor cillum dolore eu fugiat nulla voluptate.'
    },
    {
        title: 'Yet Another Item Title',
        label: '1day ago',
        desc: 'Duis aute irure dolor in reprehenderit in voluptate nulla pariatur.'
    }
  ];

  document.addEventListener('init', function(event) {
    var page = event.target;
    if(page.id === "home-page") {
      var onsListContent = document.querySelector('#main-list').innerHTML;

      items.forEach(function(item, index) {
        var onsListItem = '<ons-list-item tappable onclick="app.showDetail(' + index + ')">' +
            '<div class="left">' +
              '<div class="list__item__thumbnail picture"></div>' +
            '</div>' +
            '<div class="center">' +
              '<div class="list__item__title">' + item.title + '</div>' +
              '<div class="list__item__subtitle">' + item.desc + '</div>' +
            '</div>' +
            '<div class="right">' +
              '<span class="label">' + item.label + '</span>' +
            '</div>' +
          '</ons-list-item>'
        ;

        onsListContent += onsListItem;
      });

      document.querySelector('#main-list').innerHTML = onsListContent;
    }

    if(page.id === "detail-page") {
      var item = items[(page.data || {}).itemIndex] || {};
      page.querySelector('#title').innerHTML = item.title || 'foo';
      page.querySelector('#desc').innerHTML = item.desc || 'bar';
      page.querySelector('#label').innerHTML = item.label || 'baz';

      var i = 5,
        onsListContent = '',
        onsListItem = document.querySelector('#lorem-list').innerHTML;

      while(--i) {
        onsListContent += onsListItem;
      }

      document.querySelector('#lorem-list').innerHTML = onsListContent;
    }

  });

})();
