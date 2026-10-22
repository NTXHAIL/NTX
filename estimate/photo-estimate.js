/* Native photo estimate for the public GoHighLevel form dsQjqW6FwRZgbEqR7jXO.
   Photos are resized in the browser, then posted as multipart to the same
   endpoint the embedded widget uses. No API token is included. */
(function () {
  var FORM_ID = "dsQjqW6FwRZgbEqR7jXO";
  var LOCATION_ID = "o6DlmLuYCNFntSijxhMG";
  var FILE_FIELD = "PpEUrFruyUtMXr16qhZ2";
  var YEAR_FIELD = "uXk1aEoqXmtNOQYSvRBo";
  var MAKE_FIELD = "PYHficDYdCpxBgP6Ghmg";
  var MODEL_FIELD = "P25ojyVjwWOJr6wTvdxY";
  var INSURANCE_FIELD = "EcZ7ZBwUhSeR1x5Vs7Cp";
  var NOTES_FIELD = "sakz4lDzZZRAE6nk4MsW";
  var MAX_EDGE = 1800;
  var JPEG_QUALITY = 0.78;
  var MAX_FILES = 20;
  var SUBMIT_URL = "https://backend.leadconnectorhq.com/forms/submit?formId=" + FORM_ID + "&locationId=" + LOCATION_ID;
  var WIDGET_URL = "https://api.leadconnectorhq.com/widget/form/" + FORM_ID;
  var TERMS_HTML = [
    '<p style="font-family: Inter;font-size: 16px;font-weight: 400;color: #344054FF;">By checking this box, I consent to receive non-marketing text messages from NTX Hail about estimate updates, appointment scheduling and repair status. Message frequency varies, message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.</p>',
    '<p style="font-family: Inter;font-size: 16px;font-weight: 400;color: #344054FF;">By checking this box, I consent to receive marketing and promotional messages including special offers, discounts, new product updates among others, from NTX Hail at the phone number provided. Frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.</p>'
  ];
  var YEARS = [];
  for (var y = 2027; y >= 1995; y--) YEARS.push(String(y));
  var MAKES = ["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jaguar","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda","Mercedes-Benz","Mini","Mitsubishi","Nissan","Porsche","Ram","Rivian","Subaru","Tesla","Toyota","Volkswagen","Volvo","Other"];
  var started = Date.now();
  var photos = [];
  var busy = false;
  var heicLoader = null;

  function textFromHtml(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }
  var termText = TERMS_HTML.map(textFromHtml);

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") node.addEventListener(key.slice(2), attrs[key]);
        else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function bytesLabel(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + " KB";
    return (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 2 : 1) + " MB";
  }

  function isHeic(file) {
    var name = (file.name || "").toLowerCase();
    var type = (file.type || "").toLowerCase();
    return type.indexOf("heic") !== -1 || type.indexOf("heif") !== -1 || /\.hei[cf]$/.test(name);
  }

  function loadHeic2any() {
    if (window.heic2any) return Promise.resolve(window.heic2any);
    if (heicLoader) return heicLoader;
    heicLoader = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
      script.async = true;
      script.onload = function () {
        if (window.heic2any) resolve(window.heic2any);
        else reject(new Error("HEIC converter did not load"));
      };
      script.onerror = function () { reject(new Error("HEIC converter did not load")); };
      document.head.appendChild(script);
    });
    return heicLoader;
  }

  function bitmapFromBlob(blob) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(blob, { imageOrientation: "from-image" }).catch(function () {
        return createImageBitmap(blob);
      });
    }
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read that photo")); };
      img.src = url;
    });
  }

  function canvasToJpeg(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error("Could not compress that photo"));
        else resolve(blob);
      }, "image/jpeg", JPEG_QUALITY);
    });
  }

  function drawScaled(source) {
    var width = source.width || source.naturalWidth;
    var height = source.height || source.naturalHeight;
    var scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    var w = Math.max(1, Math.round(width * scale));
    var h = Math.max(1, Math.round(height * scale));
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    if (source.close) source.close();
    return canvas;
  }

  function compressFile(file) {
    var startedAt = (window.performance && performance.now) ? performance.now() : Date.now();
    var prepare = isHeic(file)
      ? bitmapFromBlob(file).catch(function () {
          return loadHeic2any().then(function (heic2any) {
            return heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
          }).then(function (out) {
            return bitmapFromBlob(Array.isArray(out) ? out[0] : out);
          });
        })
      : bitmapFromBlob(file);
    return prepare.then(drawScaled).then(canvasToJpeg).then(function (blob) {
      var base = (file.name || "photo").replace(/\.[^.]+$/, "").replace(/[^\w.\- ]+/g, "") || "photo";
      var jpeg = new File([blob], base + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
      var elapsed = ((window.performance && performance.now) ? performance.now() : Date.now()) - startedAt;
      return {
        id: Math.random().toString(36).slice(2),
        file: jpeg,
        originalBytes: file.size,
        width: 0,
        height: 0,
        ms: Math.round(elapsed),
        url: URL.createObjectURL(jpeg)
      };
    });
  }

  function queryParams() {
    var incoming = new URLSearchParams(window.location.search);
    var keep = {};
    var prefill = {};
    incoming.forEach(function (value, key) {
      var name = String(key || "").toLowerCase();
      if (!value || value.length > 300) return;
      if (name === "fbclid" || name === "gclid" || name.indexOf("utm_") === 0) keep[name] = value;
      if (name === "first_name" || name === "last_name" || name === "phone" || name === "email" || name === "full_name") prefill[name] = value;
    });
    return { keep: keep, prefill: prefill };
  }

  function timezoneLabel() {
    var zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    var match = new Date().toString().match(/([A-Z]+[+-][0-9]{2})([0-9]{2})/);
    var offset = match ? "(" + match[1] + ":" + match[2] + ")" : "";
    return (zone + " " + offset).trim();
  }

  function gaClientId() {
    var match = document.cookie.match(/(?:^|; )_ga=([^;]+)/);
    if (!match) return "";
    var parts = decodeURIComponent(match[1]).split(".");
    return parts.length >= 4 ? parts.slice(-2).join(".") : "";
  }

  function buildPayload(form) {
    var data = queryParams();
    var fields = {
      formId: FORM_ID,
      locationId: LOCATION_ID,
      Timezone: timezoneLabel(),
      timeSpent: Math.round((Date.now() - started) / 1000),
      eventData: {
        source: window.location.href,
        referrer: document.referrer || "",
        page_url: window.location.href,
        url_params: data.keep,
        medium: "form",
        mediumId: FORM_ID
      }
    };
    var ga = gaClientId();
    if (ga) fields.eventData.gaClientId = ga;
    fields[YEAR_FIELD] = form.year.value;
    fields[MAKE_FIELD] = form.make.value;
    fields[MODEL_FIELD] = form.model.value.trim();
    if (form.insurance.value) fields[INSURANCE_FIELD] = form.insurance.value;
    fields.first_name = form.first_name.value.trim();
    if (form.last_name.value.trim()) fields.last_name = form.last_name.value.trim();
    fields.phone = normalizePhone(form.phone.value);
    if (form.email.value.trim()) fields.email = form.email.value.trim();
    if (form.notes.value.trim()) fields[NOTES_FIELD] = form.notes.value.trim();
    fields.terms_and_conditions = termText[0] + "; " + termText[1];
    fields.terms_and_conditions_1 = true;
    fields.terms_and_conditions_2 = true;
    return fields;
  }

  function normalizePhone(value) {
    var trimmed = value.trim();
    var digits = trimmed.replace(/\D/g, "");
    if (trimmed.charAt(0) === "+" && digits.length >= 10) return "+" + digits;
    if (digits.length === 10) return "+1" + digits;
    if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
    return trimmed;
  }

  function postMultipart(body, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      var sawBytes = false;
      xhr.open("POST", SUBMIT_URL);
      xhr.timeout = 120000;
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable && event.loaded > 0) {
          sawBytes = true;
          onProgress(event.loaded / event.total);
        }
      };
      xhr.onload = function () {
        var parsed = null;
        try { parsed = JSON.parse(xhr.responseText); } catch (e) {}
        resolve({ status: xhr.status, body: parsed, text: xhr.responseText || "", sawBytes: sawBytes });
      };
      xhr.onerror = function () { reject({ message: "network", sawBytes: sawBytes }); };
      xhr.ontimeout = function () { reject({ message: "timeout", sawBytes: sawBytes }); };
      xhr.send(body);
    });
  }

  function postSimple(body) {
    return fetch(SUBMIT_URL, { method: "POST", body: body }).then(function (res) {
      return res.text().then(function (text) {
        var parsed = null;
        try { parsed = JSON.parse(text); } catch (e) {}
        return { status: res.status, body: parsed, text: text, sawBytes: true };
      });
    });
  }

  function accepted(result) {
    if (!result || result.status < 200 || result.status >= 300) return false;
    if (result.body && result.body.status === false) return false;
    return true;
  }

  function serverMessage(result) {
    var body = result && result.body;
    if (!body) return "";
    if (typeof body.message === "string") return body.message;
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.msg === "string") return body.msg;
    return "";
  }

  var root, form, statusNode, progressNode, progressBar, photoList, fileInput, submitBtn, fallbackHost;

  function setStatus(message, kind) {
    statusNode.textContent = message || "";
    statusNode.className = "pe-status" + (kind ? " pe-" + kind : "");
    statusNode.hidden = !message;
  }

  function renderPhotos() {
    photoList.innerHTML = "";
    photos.forEach(function (photo) {
      var img = el("img", { src: photo.url, alt: "" });
      var meta = el("div", { class: "pe-photo-meta" }, [
        el("strong", { text: photo.file.name }),
        el("span", { text: bytesLabel(photo.originalBytes) + " → " + bytesLabel(photo.file.size) })
      ]);
      var remove = el("button", { type: "button", class: "pe-remove", text: "Remove", "aria-label": "Remove " + photo.file.name });
      remove.addEventListener("click", function () {
        URL.revokeObjectURL(photo.url);
        photos = photos.filter(function (item) { return item.id !== photo.id; });
        renderPhotos();
      });
      var item = el("li", { class: "pe-photo", "data-before": String(photo.originalBytes), "data-after": String(photo.file.size), "data-ms": String(photo.ms) }, [img, meta, remove]);
      photoList.appendChild(item);
    });
    fileInput.required = photos.length === 0;
  }

  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    if (photos.length + incoming.length > MAX_FILES) {
      setStatus("You can attach up to " + MAX_FILES + " photos.", "error");
      incoming = incoming.slice(0, MAX_FILES - photos.length);
    }
    if (!incoming.length) return;
    busy = true;
    submitBtn.disabled = true;
    var chain = Promise.resolve();
    incoming.forEach(function (file, index) {
      chain = chain.then(function () {
        setStatus("Preparing photo " + (index + 1) + " of " + incoming.length + "…", "info");
        return compressFile(file).then(function (photo) {
          photos.push(photo);
          renderPhotos();
        });
      });
    });
    chain.then(function () {
      setStatus("", "");
    }).catch(function (error) {
      setStatus(error && error.message ? error.message : "One photo could not be prepared. Try a JPEG or PNG.", "error");
    }).then(function () {
      busy = false;
      submitBtn.disabled = false;
      fileInput.value = "";
    });
  }

  function validate(formNode) {
    if (!photos.length) return "Add at least one hail damage photo.";
    if (!formNode.year.value) return "Select the vehicle year.";
    if (!formNode.make.value) return "Select the vehicle make.";
    if (!formNode.model.value.trim()) return "Enter the vehicle model.";
    if (!formNode.first_name.value.trim()) return "Enter your first name.";
    var digits = formNode.phone.value.replace(/\D/g, "");
    if (digits.length < 10) return "Enter a phone number we can text or call about this estimate.";
    if (formNode.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formNode.email.value.trim())) return "Enter a valid email, or leave it blank.";
    if (!formNode.consent_service.checked || !formNode.consent_marketing.checked) return "Both consent boxes are required.";
    return "";
  }

  function showFallback() {
    if (fallbackHost.childNodes.length) {
      fallbackHost.hidden = false;
      return;
    }
    var params = queryParams();
    var extra = new URLSearchParams();
    Object.keys(params.keep).forEach(function (key) { extra.append(key, params.keep[key]); });
    ["first_name", "last_name", "full_name", "phone", "email"].forEach(function (key) {
      if (params.prefill[key]) extra.append(key, params.prefill[key]);
    });
    var qs = extra.toString();
    var iframe = el("iframe", {
      src: qs ? WIDGET_URL + "?" + qs : WIDGET_URL,
      title: "NTX Hail Photo Estimate",
      id: "inline-" + FORM_ID,
      "data-form-id": FORM_ID,
      "data-form-name": "NTX Hail Photo Estimate",
      "data-layout-iframe-id": "inline-" + FORM_ID,
      "data-height": "1600",
      "data-layout": "{'id':'INLINE'}",
      "data-trigger-type": "alwaysShow",
      "data-activation-type": "alwaysActivated",
      "data-deactivation-type": "neverDeactivate"
    });
    fallbackHost.hidden = false;
    fallbackHost.appendChild(iframe);
    if (!document.querySelector("script[src*='form_embed.js']")) {
      var script = document.createElement("script");
      script.src = "https://link.msgsndr.com/js/form_embed.js";
      document.body.appendChild(script);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    var problem = validate(form);
    if (problem) {
      setStatus(problem, "error");
      return;
    }
    busy = true;
    submitBtn.disabled = true;
    progressNode.hidden = false;
    progressBar.style.width = "0%";
    progressBar.parentNode.setAttribute("aria-valuenow", "0");
    setStatus("Uploading compressed photos…", "info");
    var fd = new FormData();
    var payload = buildPayload(form);
    fd.set("formData", JSON.stringify(payload));
    fd.append("locationId", LOCATION_ID);
    fd.append("formId", FORM_ID);
    photos.forEach(function (photo) { fd.append(FILE_FIELD, photo.file, photo.file.name); });
    var simpleBody = new FormData();
    simpleBody.set("formData", fd.get("formData"));
    simpleBody.append("locationId", LOCATION_ID);
    simpleBody.append("formId", FORM_ID);
    photos.forEach(function (photo) { simpleBody.append(FILE_FIELD, photo.file, photo.file.name); });

    postMultipart(fd, function (ratio) {
      var pct = Math.round(ratio * 100);
      progressBar.style.width = pct + "%";
      progressBar.parentNode.setAttribute("aria-valuenow", String(pct));
    }).catch(function (error) {
      if (error && error.sawBytes) throw error;
      setStatus("Sending photos…", "info");
      return postSimple(simpleBody);
    }).then(function (result) {
      if (accepted(result)) {
        progressBar.style.width = "100%";
        window.location.assign("/estimate/thanks/");
        return;
      }
      var detail = serverMessage(result);
      setStatus(detail || "The estimate did not go through. Use the standard form below.", "error");
      showFallback();
    }).catch(function (error) {
      if (error && error.sawBytes) {
        setStatus("The upload finished, but the estimate desk did not confirm it. If you do not hear back, use the standard form below.", "error");
      } else if (error && error.message === "timeout") {
        setStatus("The upload timed out. Use the standard form below.", "error");
      } else {
        setStatus("The fast upload could not reach the estimate desk from this browser. Use the standard form below.", "error");
      }
      showFallback();
    }).then(function () {
      busy = false;
      submitBtn.disabled = false;
    });
  }

  function field(label, control, hint) {
    var nodes = [el("span", { text: label }), control];
    if (hint) nodes.push(el("small", { text: hint }));
    return el("label", { class: "pe-field" }, nodes);
  }

  function select(name, options, placeholder) {
    var node = el("select", { name: name, required: "required" }, [
      el("option", { value: "", text: placeholder })
    ]);
    options.forEach(function (option) {
      node.appendChild(el("option", { value: option, text: option }));
    });
    return node;
  }

  function mount(host) {
    var style = document.createElement("style");
    style.textContent = [
      "#photo-estimate{font-family:\"DM Sans\",sans-serif;color:#1A2433}",
      "#photo-estimate *{box-sizing:border-box}",
      "#photo-estimate .pe-form{display:grid;gap:14px;padding:16px}",
      "#photo-estimate h3{font-family:\"Bebas Neue\",sans-serif;font-size:28px;font-weight:400;letter-spacing:.4px;margin:0}",
      "#photo-estimate p{margin:0;color:#6B7C93;font-size:14px;line-height:1.45}",
      "#photo-estimate .pe-field{display:grid;gap:6px;font-size:14px;font-weight:600}",
      "#photo-estimate .pe-field small{font-weight:400;color:#6B7C93}",
      "#photo-estimate input,#photo-estimate select,#photo-estimate textarea{width:100%;min-height:48px;padding:10px 12px;border:1px solid #DDE3EC;border-radius:8px;font:400 16px/1.4 \"DM Sans\",sans-serif;color:#1A2433;background:#fff}",
      "#photo-estimate textarea{min-height:96px;resize:vertical}",
      "#photo-estimate input:focus,#photo-estimate select:focus,#photo-estimate textarea:focus{outline:2px solid #1565C0;border-color:#1565C0}",
      "#photo-estimate .pe-grid{display:grid;gap:12px}",
      "@media(min-width:640px){#photo-estimate .pe-grid{grid-template-columns:1fr 1fr}}",
      "#photo-estimate .pe-photos{display:flex;flex-wrap:wrap;gap:10px;margin:0;padding:0;list-style:none}",
      "#photo-estimate .pe-photo{width:108px;background:#F7F9FC;border:1px solid #DDE3EC;border-radius:10px;overflow:hidden}",
      "#photo-estimate .pe-photo img{display:block;width:108px;height:80px;object-fit:cover;background:#E3F2FD}",
      "#photo-estimate .pe-photo-meta{display:grid;gap:2px;padding:6px 8px 0;font-size:11px;font-weight:400;color:#6B7C93}",
      "#photo-estimate .pe-photo-meta strong{font-size:11px;color:#1A2433;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "#photo-estimate .pe-remove{border:0;background:transparent;color:#C62828;font:600 12px \"DM Sans\",sans-serif;padding:6px 8px 8px;cursor:pointer}",
      "#photo-estimate .pe-check{display:grid;grid-template-columns:20px 1fr;gap:10px;align-items:flex-start;font-size:13px;font-weight:400;line-height:1.45}",
      "#photo-estimate .pe-check input{width:20px;height:20px;min-height:20px;margin-top:2px;accent-color:#1565C0}",
      "#photo-estimate .pe-radios{display:flex;flex-wrap:wrap;gap:12px 16px;font-weight:500}",
      "#photo-estimate .pe-radios label{display:flex;gap:6px;align-items:center;font-weight:500}",
      "#photo-estimate .pe-radios input{width:18px;min-height:18px;height:18px}",
      "#photo-estimate .pe-submit{min-height:52px;border:0;border-radius:8px;background:#1565C0;color:#fff;font:700 16px \"DM Sans\",sans-serif;cursor:pointer}",
      "#photo-estimate .pe-submit:disabled{opacity:.65;cursor:progress}",
      "#photo-estimate .pe-submit:hover:not(:disabled){background:#0d47a1}",
      "#photo-estimate .pe-progress{height:8px;background:#E3F2FD;border-radius:99px;overflow:hidden}",
      "#photo-estimate .pe-progress span{display:block;height:100%;width:0;background:#1565C0}",
      "#photo-estimate .pe-status{font-size:14px;font-weight:600;color:#1A2433}",
      "#photo-estimate .pe-error{color:#C62828}",
      "#photo-estimate .pe-info{color:#1565C0}",
      "#photo-estimate .pe-alt{justify-self:start;border:0;background:transparent;color:#1565C0;font:600 14px \"DM Sans\",sans-serif;padding:0;cursor:pointer;text-decoration:underline}",
      "#photo-estimate .pe-links{display:flex;gap:12px;font-size:13px}",
      "#photo-estimate .pe-links a{color:#1565C0;font-weight:600}",
      "#photo-estimate .pe-fallback iframe{display:block;width:100%;min-height:1180px;border:0}"
    ].join("");
    document.head.appendChild(style);

    fileInput = el("input", { type: "file", name: "photos", accept: "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif", multiple: "multiple", required: "required" });
    fileInput.addEventListener("change", function () { addFiles(fileInput.files); });
    photoList = el("ul", { class: "pe-photos" });
    var year = select("year", YEARS, "Select year");
    var make = select("make", MAKES, "Select make");
    var model = el("input", { name: "model", required: "required", autocomplete: "off", maxlength: "80" });
    var insurance = el("div", { class: "pe-radios" });
    ["Yes", "No", "Not sure"].forEach(function (choice) {
      var input = el("input", { type: "radio", name: "insurance", value: choice });
      insurance.appendChild(el("label", {}, [input, el("span", { text: choice })]));
    });
    var first = el("input", { name: "first_name", required: "required", autocomplete: "given-name", maxlength: "80" });
    var last = el("input", { name: "last_name", autocomplete: "family-name", maxlength: "80" });
    var phone = el("input", { name: "phone", type: "tel", required: "required", autocomplete: "tel", inputmode: "tel", maxlength: "24" });
    var email = el("input", { name: "email", type: "email", autocomplete: "email", maxlength: "120" });
    var notes = el("textarea", { name: "notes", maxlength: "2000" });
    var consent1 = el("input", { type: "checkbox", name: "consent_service", required: "required" });
    var consent2 = el("input", { type: "checkbox", name: "consent_marketing", required: "required" });
    progressBar = el("span");
    progressNode = el("div", { class: "pe-progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0", "aria-label": "Upload progress" }, [progressBar]);
    progressNode.hidden = true;
    statusNode = el("div", { class: "pe-status", role: "status" });
    statusNode.hidden = true;
    submitBtn = el("button", { type: "submit", class: "pe-submit", text: "Get My Estimate" });
    fallbackHost = el("div", { class: "pe-fallback" });
    fallbackHost.hidden = true;
    var prefill = queryParams().prefill;
    if (prefill.full_name && !prefill.first_name) {
      var parts = prefill.full_name.split(/\s+/);
      prefill.first_name = parts.shift() || "";
      if (!prefill.last_name) prefill.last_name = parts.join(" ");
    }
    if (prefill.first_name) first.value = prefill.first_name;
    if (prefill.last_name) last.value = prefill.last_name;
    if (prefill.phone) phone.value = prefill.phone;
    if (prefill.email) email.value = prefill.email;

    form = el("form", { class: "pe-form", novalidate: "novalidate" }, [
      el("div", {}, [
        el("h3", { text: "Send panel photos" }),
        el("p", { text: "Photos are resized on your phone before they upload, so a full camera roll sends much faster." })
      ]),
      field("Hail damage photos", fileInput),
      photoList,
      el("div", { class: "pe-grid" }, [
        field("Vehicle year", year),
        field("Vehicle make", make)
      ]),
      field("Vehicle model", model),
      el("div", { class: "pe-field" }, [
        el("span", { text: "Filing with insurance?" }),
        insurance
      ]),
      el("div", { class: "pe-grid" }, [
        field("First name", first),
        field("Last name", last)
      ]),
      field("Phone", phone, "We only use this number to reply about your estimate."),
      field("Email", email),
      field("Notes (optional)", notes),
      el("label", { class: "pe-check" }, [consent1, el("span", { text: termText[0] })]),
      el("label", { class: "pe-check" }, [consent2, el("span", { text: termText[1] })]),
      progressNode,
      statusNode,
      submitBtn,
      el("button", { type: "button", class: "pe-alt", text: "Use the standard form" }),
      el("div", { class: "pe-links" }, [
        el("a", { href: "/privacy-policy/", text: "Privacy Policy" }),
        el("a", { href: "/terms/", text: "Terms of Service" })
      ]),
      fallbackHost
    ]);
    form.querySelector(".pe-alt").addEventListener("click", function () {
      setStatus("The standard form is below.", "info");
      showFallback();
    });
    form.addEventListener("submit", onSubmit);
    host.appendChild(form);
  }

  function boot() {
    root = document.getElementById("photo-estimate");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    mount(root);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NTXPhotoEstimate = { compressFile: compressFile, termText: termText };
})();
