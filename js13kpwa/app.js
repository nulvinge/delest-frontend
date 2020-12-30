let parser = {};

// Generating content based on the template
const template = `<article>
  <h3>AUTHOR GROUP</h3>
  <span class="date">DATE</span>
  TEXT
  MEDIA
  CHILDS
</article>`;
const mediaTemplate = `<img width='WIDTH' height='HEIGHT' src='data/img/placeholder.png' data-src='' style="background-color:COLOR;" >`
function makeView(id, entry, isChild, entries) {
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

let Key = '';

//localStorage.removeItem("Key");

async function getGroups() {
    return ["G1"];
}

async function fetchEndpoint(urlFragment) {
    const url = API_ENDPOINT + urlFragment;
    console.log("Fetching: " + url);
    return await fetch(url, { method: 'GET' });
}

async function fetchEndpointXml(urlFragment) {
    const response = await fetchEndpoint(urlFragment);
    const body = await response.text();
    return parser.parse(body);
}

async function fetchEndpointJson(urlFragment) {
    const response = await fetchEndpoint(urlFragment);
    const body = await response.text();
    return JSON.parse(body);
}

async function fetchList(prefix) {
    const json = await fetchEndpointXml('?delimiter=/&prefix=' + prefix);
    console.log(json);
    return json.ListBucketResult;
}

function toArray(x) {
    if(Array.isArray(x)) {
        return x;
    }
    return [x];
}

async function getEntries() {
    let entries = [];
    let groups = await getGroups();
    for(const group of groups) {
        const groupJson = await fetchList(group + '/');
        for(const postPrefix of toArray(groupJson.CommonPrefixes)) {
            const postJson = await fetchList(postPrefix.Prefix);
            for(const content of toArray(postJson.Contents)) {
                const entry = await fetchEndpointJson(content.Key);
                console.log(entry);
                entries.push(entry);
            }
        }
    }

    console.log(entries);
    return entries;
}


async function getContent() {
  Key = localStorage.getItem("Key");
  
  let content = '';
  if(Key) {
      let entries = await getEntries();
      for (const [id, entry] of Object.entries(entries)) {
        if(entry.parent !== null)
          continue;
        content += makeView(id, entry, false, entries);
      }
  } else {
      content = `<button id="createNewKey">Create new key</button>
                 <input id="mnemonic" width="100%"></input>
                 <button id="importKey">Import key from mnemonic</button>`;
  }
  return content;
}

window.addEventListener('load', async () => {
    parser = (await import('./parser.min.js')).parser;
    await refresh();

    const createNewKeyButton = document.getElementById('createNewKey');
    if(createNewKeyButton) {
        createNewKeyButton.addEventListener('click', async () => {
            let bip = await import('./bip39.js');
            let key = await window.crypto.subtle.generateKey(
                { name: "AES-CTR", length: 256, },
                true,
                ["encrypt", "decrypt"]
            )

            //let jwk = await window.crypto.subtle.exportKey("jwk", Key)
            let raw = await window.crypto.subtle.exportKey("raw", key)
            Key = ab2str(raw);
            localStorage.setItem("Key", Key);
            let mnemonic = await bip.entropyToMnemonic(raw);
            let content = `Write this down: ` + mnemonic //jwk.k
                        + `<br/>Then click refresh above`;

            document.getElementById('content').innerHTML = content;
        });
    }
    const importKeyButton = document.getElementById('importKey');
    if(importKeyButton) {
        importKeyButton.addEventListener('click', async () => {
            let mnemonic  = document.getElementById('mnemonic').value;

            let bip = await import('./bip39.js');
            let raw = await bip.mnemonicToEntropy(mnemonic);
            Key = ab2str(raw);
            localStorage.setItem("Key", Key)

            await refresh();
        });
    }
});

// Registering Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

document.getElementById('viewKey').addEventListener('click', async () => {
    let bip = await import('./bip39.js');
    let raw = str2ab(Key);
    let mnemonic = await bip.entropyToMnemonic(raw);
    let content = `Write this down: ` + mnemonic //jwk.k
                + `<br/>Then click refresh above`;

    document.getElementById('content').innerHTML = content;
});

async function refresh() {
    document.getElementById('content').innerHTML = await getContent();
}

document.getElementById('refresh').addEventListener('click', async () => {
    await refresh();
});

const API_ENDPOINT = "https://s3.eu-north-1.amazonaws.com/deleth/"
document.getElementById('post').addEventListener('click', () => {
    document.getElementById('content').innerHTML = `
        <button id='postSubmit'>Post</button>
        <input id='postText' width='100%'><br/>
        <input id='postFile' type='file'>
    `;

    document.getElementById('postSubmit').addEventListener('click', async () => {
        let text = document.getElementById('postText').value;
        let group = "G1";
        let date = new Date().toISOString();
        let data = {
            parent: null,
            author: "Niklas Ulvinge",
            group: group,
            text:  text,
            date: date,
        };
        let body = JSON.stringify(data);

        console.log(body);
        const uploadUrl = API_ENDPOINT + group + '/' + date + '/post';
        console.log(uploadUrl);
        const result = await fetch(uploadUrl, { method: 'PUT', body: body });
        console.log(result);

        await refresh();
    });
});

// Requesting permission for Notifications after clicking on the button
document.getElementById('notifications').addEventListener('click', () => {
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
