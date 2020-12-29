// Generating content based on the template
const template = `<article>
  <h3>AUTHOR GROUP</h3>
  <span class="date">DATE</span>
  TEXT
  MEDIA
  CHILDS
</article>`;
const mediaTemplate = `<img width='WIDTH' height='HEIGHT' src='data/img/placeholder.png' data-src='' style="background-color:COLOR;" >`
function makeView(id, entry, isChild) {
  let childs = "";
  for (const [childId, child] of Object.entries(entries)) {
    if(child.parent === id) {
        childs += makeView(childId, child, true)
    }
  }
  let media = "";
  if(entry.media) {
    let me = entries[entry.media[0].id];
    media = mediaTemplate
          .replace(/COLOR/, me.color)
          .replace(/WIDTH/, entry.media[0].width)
          .replace(/HEIGHT/, entry.media[0].height);
  }
  let group = "";
  if(!isChild)
    group = "> " + entry.group;

  let entryView = template
    .replace(/AUTHOR/g, entry.author)
    .replace(/DATE/g, entry.date)
    .replace(/TEXT/g, entry.text)
    .replace(/GROUP/g, group)
    .replace(/MEDIA/g, media)
    .replace(/CHILDS/g, childs);
  return entryView;
}


let content = '';
for (const [id, entry] of Object.entries(entries)) {
  if(entry.parent !== null)
    continue;

  content += makeView(id, entry, false);
}
document.getElementById('content').innerHTML = content;

// Registering Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Requesting permission for Notifications after clicking on the button
const button = document.getElementById('notifications');
button.addEventListener('click', () => {
  Notification.requestPermission().then((result) => {
    if (result === 'granted') {
      randomNotification();
    }
  });
});

// Setting up random Notification
function randomNotification() {
  const randomItem = Math.floor(Math.random() * games.length);
  const notifTitle = games[randomItem].name;
  const notifBody = `Created by ${games[randomItem].author}.`;
  const notifImg = `data/img/${games[randomItem].slug}.jpg`;
  const options = {
    body: notifBody,
    icon: notifImg,
  };
  new Notification(notifTitle, options);
  setTimeout(randomNotification, 30000);
}

// Progressive loading images
const imagesToLoad = document.querySelectorAll('img[data-src]');
const loadImages = (image) => {
  image.setAttribute('src', image.getAttribute('data-src'));
  image.onload = () => {
    image.removeAttribute('data-src');
  };
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((items) => {
    items.forEach((item) => {
      if (item.isIntersecting) {
        loadImages(item.target);
        observer.unobserve(item.target);
      }
    });
  });
  imagesToLoad.forEach((img) => {
    observer.observe(img);
  });
} else {
  imagesToLoad.forEach((img) => {
    loadImages(img);
  });
}
