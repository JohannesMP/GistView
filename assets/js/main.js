const query = document.querySelector.bind(document);

// Dom Manipulation
const gist_form     = query('#gist-form');
const gist_field    = query('#gist-field');
const reply_content = query('#reply-content');

let gist_api_url = "https://api.github.com/gists";

const log = (prefix, object) => {
  console.log(`${prefix}: ${JSON.stringify(object, null, 4)}`);
}

const updateDisplay = (prefix, object) => {
  let obj_str = JSON.stringify(object, null, 4);
  reply_content.textContent = `${prefix}:\n${obj_str}`;
};

// Form submits a gist id to load
gist_form.addEventListener('submit', (e) => {
  e.preventDefault();
  loadGist(gist_field.value);
});

// Form input validation
gist_field.oninvalid = event => {
  event.target.setCustomValidity("Enter a valid Gist ID (32 hex characters)");
}



const SetURLGistID = id => {
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    if(id) newurl = `${newurl}?gist=${id}`;
    window.history.replaceState({path:newurl},'',newurl);
  }
}

const GetURLGistID = () => {
  return new URLSearchParams(window.location.search).get("gist");
}


// Get id from query string
let gist_id = GetURLGistID();
if(gist_id !== null && gist_id.length === 32) {
    gist_field.value = gist_id;
} else {
  SetURLGistID();
}


const loadGist = id => {
  $.get({
    url: `${gist_api_url}/${id}`,
  }).done(reply => {
    SetURLGistID(id);
    getFileContent(reply["files"], (files) => {
      updateDisplay("SUCCESS", files);
    });
  }).fail(err => {
    updateDisplay("ERROR", err);
  });
}

// Github API returns content of all files in gist but some may be truncated.
// Asynchronously fetches and passes map of filename to content to callback.
const getFileContent = (data, callback) => {
  let files    = {}; // Files and their content.
  let to_fetch = {}; // Files that still need to be fetched

  for (var key in data) {
    if(data[key]["truncated"])
      to_fetch[key] = data[key]["raw_url"];
    else
      files[key]    = data[key]["content"];
  }

  // All complete, no need to async fetch
  if(Object.keys(to_fetch).length === 0)
    callback(files);
  
  // Use promises to GET content of each file
  let promises = [];
  for(let filename in to_fetch) {
    let url = to_fetch[filename];
    let promise = new Promise( (resolve, reject) => {
      $.get(url)
        .done( res => { resolve([filename, res]); } )
        .fail( err => {  reject([filename, err]); } );
    });
    promises.push(promise);
  }

  // Run promises and consolidate files object
  Promise.all(promises).then( (vals) => {
    for(let item in vals)
      files[vals[item][0]] = vals[item][1];
    callback(files);
  });
};
