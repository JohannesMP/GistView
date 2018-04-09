const query = document.querySelector.bind(document);

// Dom Manipulation
const gist_form     = query('#gist-form');
const gist_field    = query('#gist-field');
const reply_content = query('#reply-content');

const gist_upload = $("#gist-upload");

// storing params for chrome 65 bug workaround - https://stackoverflow.com/q/49723782
const gist_pattern = gist_field.getAttribute("pattern");


// Form input validation
gist_field.oninvalid = (event) => {
  event.target.setCustomValidity("Enter a valid Gist ID (32 hex characters)");
}

gist_field.oninput = (event) => {
  let slash_pos = gist_field.value.lastIndexOf("/");
  if(slash_pos != -1)
  {
    let old_val = gist_field.value;
    let new_val = old_val.substring(slash_pos+1);

    gist_field.focus();
    gist_field.value = new_val;
    return;
  }
  event.target.setCustomValidity(""); 
  event.target.removeAttribute("pattern");
}

gist_field.onchange = (event) => {
  let slash_pos = gist_field.value.lastIndexOf("/")
  event.target.setAttribute("pattern", gist_pattern);
}


// Form submits a gist id to load
gist_form.addEventListener('submit', (e) => {
  e.preventDefault();
  let id = gist_field.value;
  UpdateDisplay(`loading gist ${id}`);
  SetURLGistID(id);
  FetchGistData(id)
    .then(
      (vals)    => { UpdateDisplay("SUCCESS", SimplifyGistData(vals) ) },
      (reasons) => { UpdateDisplay("FAILURE", reasons);}
    );
});


// Button to upload gist content
gist_upload.on('click', (e) => {
  
});






const SimplifyGistData = (data) => {
  let files = data["files"];
  let file_data = {}
  for (var key in files) {
    file_data[key] = {
        filename: files[key]["filename"],
        content:  files[key]["content"],
        language: files[key]["language"]
      };
  }

  return {
    url:         data.url,
    id:          data.id,
    description: data.description,
    files:       file_data,
  }
}


// Query string logic
const SetURLGistID = (id) => {
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    if(id !== undefined) 
      newurl = `${newurl}?gist=${id}`;
    window.history.replaceState({path:newurl},'',newurl);
  }
}


// A basic pretty printing logging function
const log = (prefix, object) => {
  if(object === undefined) { console.log(prefix);}
  else console.log(`${prefix}: ${JSON.stringify(object, null, 4)}`);
}

const UpdateDisplay = (prefix, object) => {
  log(prefix, object);
  if(object === undefined) reply_content.textContent = prefix;
  else reply_content.textContent = `${prefix}:\n${JSON.stringify(object, null, 4)}`;
};



// Get id from query string
let gist_id = GetQueryParam("gist");
if(gist_id !== null && gist_id.length === 32) {
  gist_field.value = gist_id;
} else {
  SetURLGistID();
}
