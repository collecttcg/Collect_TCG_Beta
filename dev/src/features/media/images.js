/** V93 beta: features/media/images. Shared dependencies are explicit on appContext. */
export function register(appContext){
function isNearWhiteBackgroundPixel(r, g, b, a){
    if(a <= 8) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max >= 236 && min >= 224 && (max - min) <= 24;
  }

function createTransparentWatermarkLogo(source){
    const width = source.naturalWidth || source.width || 0;
    const height = source.naturalHeight || source.height || 0;
    if(!width || !height) return source;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently:true });
    ctx.imageSmoothingEnabled = true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);

    let imageData;
    try{
      imageData = ctx.getImageData(0, 0, width, height);
    }catch(err){
      console.warn("Could not analyse watermark logo background; using the original logo.", err);
      return source;
    }

    const data = imageData.data;
    const total = width * height;
    const visited = new Uint8Array(total);
    const queue = new Uint32Array(total);
    let head = 0;
    let tail = 0;

    function tryEnqueue(x, y){
      if(x < 0 || y < 0 || x >= width || y >= height) return;
      const idx = y * width + x;
      if(visited[idx]) return;
      const offset = idx * 4;
      if(!appContext.isNearWhiteBackgroundPixel(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
      visited[idx] = 1;
      queue[tail++] = idx;
    }

    for(let x = 0; x < width; x++){
      tryEnqueue(x, 0);
      tryEnqueue(x, height - 1);
    }
    for(let y = 0; y < height; y++){
      tryEnqueue(0, y);
      tryEnqueue(width - 1, y);
    }

    while(head < tail){
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;
      tryEnqueue(x - 1, y);
      tryEnqueue(x + 1, y);
      tryEnqueue(x, y - 1);
      tryEnqueue(x, y + 1);
    }

    for(let idx = 0; idx < total; idx++){
      if(!visited[idx]) continue;
      const offset = idx * 4;
      data[offset + 3] = 0;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

function loadWatermarkLogo(){
    if(appContext.watermarkLogoPromise) return appContext.watermarkLogoPromise;

    appContext.watermarkLogoPromise = new Promise((resolve,reject)=>{
      const logo = new Image();
      logo.onload = ()=>{
        try{
          resolve(appContext.createTransparentWatermarkLogo(logo));
        }catch(err){
          console.warn("Could not convert watermark logo to transparency; using the original logo.", err);
          resolve(logo);
        }
      };
      logo.onerror = ()=>{
        appContext.watermarkLogoPromise = null;
        reject(new Error("watermark logo unavailable"));
      };
      logo.src = appContext.CARD_WATERMARK_LOGO;
    });

    return appContext.watermarkLogoPromise;
  }


function loadWebsiteWatermarkBanner(){
    if(appContext.websiteWatermarkBannerPromise) return appContext.websiteWatermarkBannerPromise;

    appContext.websiteWatermarkBannerPromise = new Promise((resolve,reject)=>{
      const banner = new Image();
      banner.onload = ()=>resolve(banner);
      banner.onerror = ()=>{
        appContext.websiteWatermarkBannerPromise = null;
        reject(new Error("website watermark banner unavailable"));
      };
      banner.src = appContext.CARD_WATERMARK_BANNER;
    });

    return appContext.websiteWatermarkBannerPromise;
  }

function createWebsiteWatermarkQrCanvas(text,size=256){
    if(!text || typeof document==="undefined" || typeof QRCode!=="function") return null;

    const holder=document.createElement("div");
    holder.setAttribute("aria-hidden","true");
    holder.style.cssText="position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(holder);

    try{
      new QRCode(holder,{
        text:String(text),
        width:size,
        height:size,
        colorDark:"#000000",
        colorLight:"#ffffff",
        correctLevel:QRCode.CorrectLevel.M
      });

      const source=holder.querySelector("canvas");
      if(!source) return null;

      const copy=document.createElement("canvas");
      copy.width=source.width;
      copy.height=source.height;
      const copyCtx=copy.getContext("2d");
      if(!copyCtx) return null;
      copyCtx.drawImage(source,0,0);
      return copy;
    }catch(error){
      console.warn("Could not generate website watermark QR code:",error);
      return null;
    }finally{
      holder.remove();
    }
  }

function drawWebsiteWatermark(ctx, canvas, banner){
    const watermarkUrl=appContext.CARD_WATERMARK_URL;
    if(!watermarkUrl || !banner) return;

    // The complete user-approved 1113×242 artwork is rendered as one layer.
    // Only the QR interior is regenerated so the destination remains functional.
    const sourceW=1113;
    const sourceH=242;
    const shortSide=Math.min(canvas.width,canvas.height);
    const margin=Math.max(8,Math.round(shortSide*0.012));
    // Keep the approved banner prominent on portrait/card photos, but prevent
    // it from dominating landscape images. The 24% height cap only becomes
    // restrictive for sufficiently wide images; portrait behavior stays at
    // the existing 82% width target.
    const widthTarget=Math.round(canvas.width*0.82);
    const heightCappedWidth=Math.round(canvas.height*0.24*sourceW/sourceH);
    const bannerWidth=Math.min(
      canvas.width-margin*2,
      Math.max(280,Math.min(widthTarget,heightCappedWidth))
    );
    const bannerHeight=Math.round(bannerWidth*sourceH/sourceW);
    const bannerX=Math.round((canvas.width-bannerWidth)/2);
    const bannerY=Math.max(margin,Math.round(canvas.height-margin-bannerHeight));
    const scale=bannerWidth/sourceW;

    ctx.save();
    ctx.imageSmoothingEnabled=true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality="high";

    ctx.drawImage(banner,bannerX,bannerY,bannerWidth,bannerHeight);

    const qrCanvas=createWebsiteWatermarkQrCanvas(watermarkUrl,360);
    if(qrCanvas){
      // Approved artwork QR interior: preserve its surrounding gold/black frame.
      const qrX=bannerX+885*scale;
      const qrY=bannerY+27*scale;
      const qrSize=166*scale;
      ctx.fillStyle="#ffffff";
      ctx.fillRect(qrX,qrY,qrSize,qrSize);
      ctx.drawImage(qrCanvas,qrX,qrY,qrSize,qrSize);
    }

    ctx.restore();
  }

function drawWatermark(ctx, canvas, logo, banner){
    // The watermark logo is preprocessed into a transparent canvas so its white background is removed.

    const margin = Math.max(12, Math.round(Math.min(canvas.width, canvas.height) * 0.024));
    const targetWidth = Math.min(
      420,
      Math.max(120, Math.round(canvas.width * 0.20))
    );
    const ratio = logo.naturalHeight && logo.naturalWidth
      ? logo.naturalHeight / logo.naturalWidth
      : 1;
    const targetHeight = Math.round(targetWidth * ratio);
    const offsetLeft = Math.max(14, Math.round(targetWidth * 0.10));
    const offsetDown = Math.max(16, Math.round(targetHeight * 0.20));
    const x = Math.max(margin, canvas.width - targetWidth - margin - offsetLeft);
    const y = Math.min(canvas.height - targetHeight - margin, margin + offsetDown);
    const glowBlur = Math.max(12, Math.round(targetWidth * 0.10));
    const lift = Math.max(3, Math.round(targetWidth * 0.018));

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";

    if("filter" in ctx){
      ctx.filter = `drop-shadow(0 ${lift}px ${glowBlur}px rgba(0,0,0,0.42)) saturate(1.34) contrast(1.12) brightness(1.06)`;
    }else{
      ctx.shadowColor = "rgba(0,0,0,0.42)";
      ctx.shadowBlur = glowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = lift;
    }

    ctx.globalAlpha = 0.94;
    ctx.drawImage(logo, x, y, targetWidth, targetHeight);

    // Add a subtle second pass so the colors feel more vibrant and the mark pops a little more.
    if("filter" in ctx){
      ctx.filter = "saturate(1.20) contrast(1.04) brightness(1.03)";
    }else{
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.globalAlpha = 0.28;
    ctx.drawImage(logo, x, y, targetWidth, targetHeight);
    ctx.restore();

    appContext.drawWebsiteWatermark(ctx, canvas, banner);

  }

function shouldApplySoldDownloadWatermark(card){
    return appContext.canonicalAvailability(card?.availability) === "Sold";
  }

function drawSoldDownloadWatermark(ctx, canvas){
    const shortSide = Math.min(canvas.width, canvas.height);
    const triangleSize = Math.max(150, Math.min(520, Math.round(shortSide * 0.42)));
    const center = triangleSize * 0.33;
    const maxTextWidth = triangleSize * 0.70;

    ctx.save();

    ctx.shadowColor = "rgba(0,0,0,0.34)";
    ctx.shadowBlur = Math.max(10, Math.round(triangleSize * 0.045));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(4, Math.round(triangleSize * 0.02));

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(triangleSize, 0);
    ctx.lineTo(0, triangleSize);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.translate(center, center);
    ctx.rotate(-Math.PI / 4);

    let fontSize = Math.max(22, Math.min(76, Math.round(triangleSize * 0.19)));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    const applyFont = ()=>{
      ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`;
    };

    applyFont();
    while(fontSize > 12 && ctx.measureText("SOLD").width > maxTextWidth){
      fontSize -= 1;
      applyFont();
    }

    ctx.fillText("SOLD", 0, 0, maxTextWidth);
    ctx.restore();
  }

function canvasToBlob(canvas, quality = 0.96, type = "image/jpeg"){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>{
        if(blob) resolve(blob);
        else reject(new Error("Could not create image blob"));
      }, type, quality);
    });
  }

async function loadImageElementFromSource(src){
    const blob = await appContext.imageSourceToBlob(src);
    const objectUrl = URL.createObjectURL(blob);

    try{
      const img = await new Promise((resolve,reject)=>{
        const image = new Image();
        image.onload = ()=>resolve(image);
        image.onerror = ()=>reject(new Error("Could not decode image"));
        image.src = objectUrl;
      });
      return {img, originalBlob: blob};
    }finally{
      setTimeout(()=>URL.revokeObjectURL(objectUrl), 0);
    }
  }

async function renderSoldDownloadBlob(src, card, maxDim = 2400, quality = 0.96){
    const {img} = await appContext.loadImageElementFromSource(src);

    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if(!w || !h) throw new Error("invalid image dimensions");

    if(w > h && w > maxDim){
      h = Math.round(h * maxDim / w);
      w = maxDim;
    }else if(h >= w && h > maxDim){
      w = Math.round(w * maxDim / h);
      h = maxDim;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", {alpha:false});
    if(!ctx) throw new Error("canvas unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,w,h);
    ctx.imageSmoothingEnabled = true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    if(appContext.shouldApplySoldDownloadWatermark(card)){
      appContext.drawSoldDownloadWatermark(ctx, canvas);
    }

    return appContext.canvasToBlob(canvas, quality, "image/jpeg");
  }

async function renderCardImage(img, maxDim = 1800, quality = 0.94, applyWatermark = false){
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if(!w || !h) throw new Error("invalid image dimensions");

    if(w > h && w > maxDim){
      h = Math.round(h * maxDim / w);
      w = maxDim;
    }else if(h >= w && h > maxDim){
      w = Math.round(w * maxDim / h);
      h = maxDim;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", {alpha:false});
    if(!ctx) throw new Error("canvas unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,w,h);
    ctx.imageSmoothingEnabled = true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    if(applyWatermark){
      if(!appContext.requireOwner("apply image watermark")){
        throw new Error("Owner login required");
      }

      if(applyWatermark==="website"){
        const banner = await appContext.loadWebsiteWatermarkBanner();
        appContext.drawWebsiteWatermark(ctx, canvas, banner);
      }else{
        const [logo,banner] = await Promise.all([
          appContext.loadWatermarkLogo(),
          appContext.loadWebsiteWatermarkBanner()
        ]);
        appContext.drawWatermark(ctx, canvas, logo, banner);
      }
    }

    return canvas.toDataURL("image/jpeg", quality);
  }

async function renderWatermarkedImage(img, maxDim = 1800, quality = 0.94){
    return appContext.renderCardImage(img,maxDim,quality,true);
  }

async function rotateCardImageSource(source, quarterTurns = 1, quality = 0.94){
    if(!appContext.requireOwner("rotate card image")) throw new Error("Owner login required");

    const turns=((Number(quarterTurns)||0)%4+4)%4;
    if(turns===0) return source;

    const {img}=await appContext.loadImageElementFromSource(source);
    const sourceW=img.naturalWidth||img.width;
    const sourceH=img.naturalHeight||img.height;
    if(!sourceW || !sourceH) throw new Error("invalid image dimensions");

    const swap=turns%2===1;
    const canvas=document.createElement("canvas");
    canvas.width=swap ? sourceH : sourceW;
    canvas.height=swap ? sourceW : sourceH;

    const ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx) throw new Error("canvas unavailable");

    ctx.fillStyle="#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=true;
    if("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality="high";

    ctx.save();
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(turns*Math.PI/2);
    ctx.drawImage(img,-sourceW/2,-sourceH/2,sourceW,sourceH);
    ctx.restore();

    return canvas.toDataURL("image/jpeg",quality);
  }

function loadImageFromDataUrl(dataUrl){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = ()=>reject(new Error("decode failed"));
      img.src = dataUrl;
    });
  }

function normalizedImageMime(value){
    const mime=String(value||"").trim().toLowerCase();
    return mime==="image/jpg" ? "image/jpeg" : mime;
  }

function imageExtensionMatchesMime(file,mime){
    const ext=String(file?.name||"").split(".").pop()?.toLowerCase()||"";
    const expected={
      "image/jpeg":new Set(["jpg","jpeg"]),
      "image/png":new Set(["png"]),
      "image/webp":new Set(["webp"]),
      "image/gif":new Set(["gif"])
    };
    return !!expected[mime]?.has(ext);
  }

async function verifyImageDecodes(file){
    // MIME and filename are attacker-controlled metadata. Decode the bytes too.
    // createImageBitmap avoids executing active content and works on modern
    // iOS Safari / Android Chrome; Image is a compatibility fallback.
    if(typeof createImageBitmap==="function"){
      const bitmap=await createImageBitmap(file);
      const valid=bitmap.width>0 && bitmap.height>0;
      try{ bitmap.close(); }catch{}
      if(!valid) throw new Error("invalid image dimensions");
      return true;
    }

    const objectUrl=URL.createObjectURL(file);
    try{
      await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>img.naturalWidth>0 && img.naturalHeight>0
          ? resolve()
          : reject(new Error("invalid image dimensions"));
        img.onerror=()=>reject(new Error("image decode failed"));
        img.src=objectUrl;
      });
      return true;
    }finally{
      URL.revokeObjectURL(objectUrl);
    }
  }

async function validateOwnerImageFile(file,{
    allowedMimes=appContext.SAFE_GENERIC_IMAGE_MIMES,
    maxBytes=appContext.GENERIC_OWNER_IMAGE_MAX_BYTES
  }={}){
    if(!file) throw new Error("No image selected");
    if(file.size<=0) throw new Error("Image file is empty");
    if(file.size>maxBytes) throw new Error(`Image is too large (max ${Math.round(maxBytes/1024/1024)} MB)`);

    const mime=appContext.normalizedImageMime(file.type);
    if(!allowedMimes.has(mime)) throw new Error("Unsupported image format");
    if(!appContext.imageExtensionMatchesMime(file,mime)) throw new Error("Image filename does not match its format");

    await appContext.verifyImageDecodes(file);
    return mime;
  }

async function resizeImageFile(file, maxDim = 1800, quality = 0.94, applyWatermark = false){
    if(!appContext.requireOwner("process card image")) throw new Error("Owner login required");
    if(!file) throw new Error("no file");
    await appContext.validateOwnerImageFile(file,{
      allowedMimes:appContext.SAFE_CARD_IMAGE_MIMES,
      maxBytes:appContext.CARD_IMAGE_MAX_BYTES
    });

    const dataUrl = await new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onerror = ()=>reject(new Error("read failed"));
      reader.onload = ()=>resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const img = await appContext.loadImageFromDataUrl(dataUrl);
    return appContext.renderCardImage(img, maxDim, quality, applyWatermark);
  }

async function processCardImageUrl(url, maxDim = 1800, quality = 0.94, applyWatermark = false){
    if(!appContext.requireOwner("process card image URL")) throw new Error("Owner login required");

    let parsed;
    try{
      parsed = new URL(url, location.href);
      if(!["http:","https:"].includes(parsed.protocol)){
        throw new Error("unsupported URL");
      }
    }catch{
      throw new Error("invalid image URL");
    }

    const response = await appContext.fetch(parsed.href, {
      method:"GET",
      mode:"cors",
      credentials:"omit",
      referrerPolicy:"no-referrer"
    });
    if(!response.ok) throw new Error("image fetch failed");

    const contentType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if(contentType === "image/svg+xml") throw new Error("unsupported image type");
    if(contentType && !contentType.startsWith("image/") && contentType !== "application/octet-stream"){
      throw new Error("unsupported image type");
    }

    const blob = await response.blob();
    if(blob.size > appContext.CARD_IMAGE_MAX_BYTES) throw new Error("image too large");

    const objectUrl = URL.createObjectURL(blob);
    try{
      const img = await new Promise((resolve,reject)=>{
        const image = new Image();
        image.onload = ()=>resolve(image);
        image.onerror = ()=>reject(new Error("decode failed"));
        image.src = objectUrl;
      });
      return await appContext.renderCardImage(img,maxDim,quality,applyWatermark);
    }finally{
      URL.revokeObjectURL(objectUrl);
    }
  }

async function applyWatermarkToCardImageSource(source, maxDim = 1800, quality = 0.94){
    if(!appContext.requireOwner("apply image watermark")) throw new Error("Owner login required");

    if(appContext.isPendingCardImage(source)){
      const img=await appContext.loadImageFromDataUrl(source);
      return appContext.renderCardImage(img,maxDim,quality,true);
    }

    return appContext.processCardImageUrl(source,maxDim,quality,true);
  }

async function applyWebsiteWatermarkToCardImageSource(source, maxDim = 1800, quality = 0.94){
    if(!appContext.requireOwner("apply website watermark")) throw new Error("Owner login required");

    if(appContext.isPendingCardImage(source)){
      const img=await appContext.loadImageFromDataUrl(source);
      return appContext.renderCardImage(img,maxDim,quality,"website");
    }

    return appContext.processCardImageUrl(source,maxDim,quality,"website");
  }

async function watermarkImageUrl(url, maxDim = 1800, quality = 0.94){
    return appContext.processCardImageUrl(url,maxDim,quality,true);
  }

async function applyPsaPrivacyMaskToCardImageSource(source,quality=0.94){
    if(!appContext.requireOwner("hide PSA label information")) throw new Error("Owner login required");

    const img=appContext.isPendingCardImage(source)
      ? await appContext.loadImageFromDataUrl(source)
      : await new Promise(async(resolve,reject)=>{
          try{
            const response=await appContext.fetch(source,{
              method:"GET",mode:"cors",credentials:"omit",referrerPolicy:"no-referrer"
            });
            if(!response.ok) throw new Error("image fetch failed");
            const blob=await response.blob();
            const objectUrl=URL.createObjectURL(blob);
            const image=new Image();
            image.onload=()=>{ URL.revokeObjectURL(objectUrl); resolve(image); };
            image.onerror=()=>{ URL.revokeObjectURL(objectUrl); reject(new Error("decode failed")); };
            image.src=objectUrl;
          }catch(error){ reject(error); }
        });

    const canvas=document.createElement("canvas");
    canvas.width=img.naturalWidth||img.width;
    canvas.height=img.naturalHeight||img.height;

    const ctx=canvas.getContext("2d");
    if(!ctx) throw new Error("canvas unavailable");

    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    ctx.fillStyle="#000";

    for(const mask of appContext.PSA_PRIVACY_MASKS){
      ctx.fillRect(
        Math.round(canvas.width*mask.x),
        Math.round(canvas.height*mask.y),
        Math.round(canvas.width*mask.w),
        Math.round(canvas.height*mask.h)
      );
    }

    return canvas.toDataURL("image/jpeg",quality);
  }

function isPendingCardImage(value){
    return /^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(String(value||""));
  }

function dataUrlToImageBlob(dataUrl){
    const source=String(dataUrl||"");
    const match=source.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
    if(!match) throw new Error("unsupported processed image");

    const mime=match[1].toLowerCase().replace("image/jpg","image/jpeg");
    const binary=atob(match[2].replace(/\s+/g,""));
    if(binary.length>appContext.CARD_IMAGE_STORAGE_MAX_BYTES) throw new Error("processed image too large");

    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

function cardStorageExtensionForMime(mime){
    if(mime==="image/png") return "png";
    if(mime==="image/webp") return "webp";
    return "jpg";
  }

async function uploadPendingCardImage(dataUrl,index){
    if(!appContext.requireOwner("upload card image")) throw new Error("Owner login required");

    const blob=appContext.dataUrlToImageBlob(dataUrl);
    const extension=appContext.cardStorageExtensionForMime(blob.type);
    const randomPart=(crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,12)}`)
      .replace(/[^a-zA-Z0-9-]/g,"");
    const path=`${appContext.ownerSession.user.id}/${Date.now()}-${index+1}-${randomPart}.${extension}`;

    const {error}=await appContext.supabaseClient.storage
      .from(appContext.CARD_IMAGE_STORAGE_BUCKET)
      .upload(path,blob,{
        cacheControl:"31536000",
        upsert:false,
        contentType:blob.type
      });

    if(error){
      console.error("Card image Storage upload error:",error);
      const message=String(error.message||"").toLowerCase();
      if(message.includes("bucket") || message.includes("not found")){
        throw new Error("card-images Storage bucket is not installed");
      }
      if(message.includes("row-level") || message.includes("policy") || message.includes("unauthorized")){
        throw new Error("card-images Storage permission denied");
      }
      throw new Error(`card image upload failed: ${appContext.errorText(error,"unknown Storage error").slice(0,220)}`);
    }

    const {data}=appContext.supabaseClient.storage.from(appContext.CARD_IMAGE_STORAGE_BUCKET).getPublicUrl(path);
    const publicUrl=appContext.safeHttpUrl(data?.publicUrl||"");
    if(!publicUrl){
      await appContext.supabaseClient.storage.from(appContext.CARD_IMAGE_STORAGE_BUCKET).remove([path]);
      throw new Error("card image public URL unavailable");
    }

    return {url:publicUrl,path};
  }

async function removeCardStoragePaths(paths){
    if(!appContext.isOwnerMode()) return false;
    const candidates=new Set((paths||[]).map(String).filter(Boolean));
    if(!candidates.size) return true;

    // V4 image-safety fix: a later UI/metadata error must never remove an
    // image that has already been saved or referenced by a card. Read every
    // relevant page first; if references cannot be checked, retain the files.
    try{
      const protect=url=>candidates.delete(appContext.cardStoragePathFromUrl(url));
      const scan=async(table,columns,order,visit)=>{
        const pageSize=500;
        for(let offset=0;;offset+=pageSize){
          const {data,error}=await appContext.supabaseClient.from(table).select(columns)
            .order(order,{ascending:true}).range(offset,offset+pageSize-1);
          if(error || !Array.isArray(data)) throw error||new Error("Image reference check failed");
          data.forEach(visit);
          if(!candidates.size || data.length<pageSize) return;
        }
      };

      await scan("cards",appContext.thumbnailUrlSupported ? "id,images,thumbnail_url" : "id,images","id",row=>{
        (Array.isArray(row.images)?row.images:[]).forEach(protect);
        if(row.thumbnail_url) protect(row.thumbnail_url);
      });

      if(candidates.size && appContext.cardImageVariantsSupported){
        await scan("card_image_variants","image_key,original_url,watermarked_url","image_key",row=>{
          protect(row.original_url);
          protect(row.watermarked_url);
        });
      }

      if(!candidates.size) return true;
      const {error}=await appContext.supabaseClient.storage.from(appContext.CARD_IMAGE_STORAGE_BUCKET)
        .remove([...candidates]);
      if(error) throw error;
      return true;
    }catch(error){
      console.warn("Image cleanup skipped; files retained for safety:",error);
      return false;
    }
  }

function cardStoragePathFromUrl(value){
    const raw=appContext.safeHttpUrl(value);
    if(!raw || !appContext.ownerSession?.user?.id) return "";

    try{
      const fileUrl=new URL(raw);
      const projectUrl=new URL(window.COLLECT_TCG_SUPABASE_URL);
      if(fileUrl.origin!==projectUrl.origin) return "";

      const prefix=`/storage/v1/object/public/${appContext.CARD_IMAGE_STORAGE_BUCKET}/`;
      if(!fileUrl.pathname.startsWith(prefix)) return "";

      const decoded=decodeURIComponent(fileUrl.pathname.slice(prefix.length));
      const parts=decoded.split("/").filter(Boolean);
      if(parts.length<2 || parts.some(part=>part===".." || part===".")) return "";
      if(parts[0]!==appContext.ownerSession.user.id) return "";
      return parts.join("/");
    }catch{
      return "";
    }
  }

async function prepareCardImagesForStorage(formState,onProgress){
    if(!appContext.requireOwner("save card images")) throw new Error("Owner login required");

    const originalImages=Array.isArray(formState?.images) ? formState.images.slice() : [];
    const cleanSources=Array.isArray(formState?.imageCleanSources)
      ? formState.imageCleanSources.slice(0,originalImages.length)
      : [];
    const watermarkedSources=Array.isArray(formState?.imageWatermarkedSources)
      ? formState.imageWatermarkedSources.slice(0,originalImages.length)
      : [];
    const variantKeys=Array.isArray(formState?.imageVariantKeys)
      ? formState.imageVariantKeys.slice(0,originalImages.length)
      : [];
    const states=Array.isArray(formState?.imageWatermarkStates)
      ? formState.imageWatermarkStates.slice(0,originalImages.length)
      : [];

    while(cleanSources.length<originalImages.length) cleanSources.push(null);
    while(watermarkedSources.length<originalImages.length) watermarkedSources.push(null);
    while(variantKeys.length<originalImages.length) variantKeys.push(appContext.newCardImageVariantKey());
    while(states.length<originalImages.length) states.push(false);

    // Every reversible image needs a persistent clean source. For a legacy
    // photo without stored metadata, treat the currently stored image as the
    // clean source. This cannot undo a watermark that was already baked into
    // that legacy file before this feature existed.
    for(let i=0;i<originalImages.length;i++){
      if(!cleanSources[i]) cleanSources[i]=originalImages[i];
    }

    const allSources=[
      ...originalImages,
      ...cleanSources,
      ...watermarkedSources.filter(Boolean)
    ];
    const pendingUnique=[...new Set(allSources.filter(appContext.isPendingCardImage))];

    const uploadedPaths=[];
    const uploadedMap=new Map();
    let uploaded=0;

    try{
      for(let i=0;i<pendingUnique.length;i++){
        const source=pendingUnique[i];
        if(typeof onProgress==="function") onProgress(uploaded,pendingUnique.length);
        const stored=await appContext.uploadPendingCardImage(source,i);
        uploadedPaths.push(stored.path);
        uploadedMap.set(source,stored.url);
        uploaded++;
        if(typeof onProgress==="function") onProgress(uploaded,pendingUnique.length);
      }

      const resolveSource=value=>{
        if(!value) return "";
        return uploadedMap.get(value) || value;
      };

      const resolvedClean=cleanSources.map(resolveSource);
      const resolvedWatermarked=watermarkedSources.map(resolveSource);

      const resultImages=originalImages.map((image,index)=>{
        const active=states[index]===true ? "watermarked" : "original";
        if(active==="watermarked" && resolvedWatermarked[index]){
          return resolvedWatermarked[index];
        }
        return resolvedClean[index] || resolveSource(image);
      });

      const variantRecords=resultImages.map((_,index)=>({
        image_key:variantKeys[index] || appContext.newCardImageVariantKey(),
        original_url:resolvedClean[index],
        watermarked_url:resolvedWatermarked[index] || "",
        active_variant:states[index]===true && resolvedWatermarked[index]
          ? "watermarked"
          : "original"
      }));

      return {
        images:resultImages,
        originalImages,
        uploadedPaths,
        variantRecords,
        resolvedClean,
        resolvedWatermarked
      };
    }catch(error){
      await appContext.removeCardStoragePaths(uploadedPaths);
      throw error;
    }
  }

async function cleanupRemovedCardStorageImages(originalImages,currentImages,protectedVariantUrls=[]){
    if(!appContext.isOwnerMode()) return false;

    const keep=new Set(
      [...(currentImages||[]),...(protectedVariantUrls||[])]
        .map(appContext.cardStoragePathFromUrl)
        .filter(Boolean)
    );
    const removed=(originalImages||[])
      .map(appContext.cardStoragePathFromUrl)
      .filter(path=>path && !keep.has(path));

    if(!removed.length) return true;
    return appContext.removeCardStoragePaths(removed);
  }

function cardImageStorageErrorText(error){
    const message=String(error?.message||"").toLowerCase();
    if(message.includes("not installed")){
      return "Card image Storage is not installed yet. Run card-images-storage-migration.sql in Supabase, then try again.";
    }
    if(message.includes("permission")){
      return "Card image upload was blocked by Storage security policy. Check the card-images migration and owner login.";
    }
    if(message.includes("too large")){
      return "Processed image is too large for card image Storage.";
    }
    return "Could not upload the card image to Supabase Storage. Nothing was saved.";
  }

function setupCardImageRecovery(){
    const selector = '.listing-card-gallery img.thumb, .related-card-image-wrap img, ' +
      '.detail-slider-image, .detail-thumb-strip img, #imageLightboxImg, .image-lightbox-thumb';
    const states = new WeakMap();
    const fallback = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">' +
      '<rect width="600" height="840" fill="#1A1C22"/>' +
      '<text x="300" y="420" fill="#8C8F99" font-family="Arial,sans-serif" font-size="30" text-anchor="middle">Image unavailable</text></svg>'
    );

    document.addEventListener('error',event=>{
      const img = event.target;
      if(!(img instanceof HTMLImageElement) || !img.matches(selector)) return;
      const source = img.getAttribute('src');
      if(!source || source === fallback || !img.isConnected) return;

      let state = states.get(img);
      if(!state || state.source !== source){
        if(state) clearTimeout(state.timer);
        state = {source, retried:false, timer:null};
        states.set(img,state);
      }
      if(state.timer !== null) return;

      // Data/blob images cannot be repaired by another network request.
      const canRetry = /^https?:/i.test(img.src);
      if(!state.retried && canRetry){
        state.retried = true;
        state.timer = setTimeout(()=>{
          state.timer = null;
          // A slider may have moved on or its modal may have been removed.
          if(!img.isConnected || img.getAttribute('src') !== source || states.get(img) !== state) return;
          img.src = source;
        },700);
        return;
      }
      img.src = fallback;
    },true);

    document.addEventListener('load',event=>{
      const img = event.target;
      if(!(img instanceof HTMLImageElement)) return;
      const state = states.get(img);
      if(!state || img.getAttribute('src') === fallback) return;
      clearTimeout(state.timer);
      states.delete(img);
    },true);
  }

  Object.assign(appContext,{isNearWhiteBackgroundPixel,createTransparentWatermarkLogo,loadWatermarkLogo,loadWebsiteWatermarkBanner,drawWebsiteWatermark,drawWatermark,shouldApplySoldDownloadWatermark,drawSoldDownloadWatermark,canvasToBlob,loadImageElementFromSource,renderSoldDownloadBlob,renderCardImage,renderWatermarkedImage,rotateCardImageSource,loadImageFromDataUrl,normalizedImageMime,imageExtensionMatchesMime,verifyImageDecodes,validateOwnerImageFile,resizeImageFile,processCardImageUrl,applyWatermarkToCardImageSource,applyWebsiteWatermarkToCardImageSource,watermarkImageUrl,applyPsaPrivacyMaskToCardImageSource,isPendingCardImage,dataUrlToImageBlob,cardStorageExtensionForMime,uploadPendingCardImage,removeCardStoragePaths,cardStoragePathFromUrl,prepareCardImagesForStorage,cleanupRemovedCardStorageImages,cardImageStorageErrorText,setupCardImageRecovery});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.SAFE_CARD_IMAGE_MIMES = new Set(["image/jpeg","image/png","image/webp"]);

  appContext.SAFE_GENERIC_IMAGE_MIMES = new Set(["image/jpeg","image/png","image/webp","image/gif"]);

  appContext.GENERIC_OWNER_IMAGE_MAX_BYTES = 5*1024*1024;

  appContext.PSA_PRIVACY_MASKS = [
    // Fixed positions based on the standard PSA slab framing used by Collect TCG.
    // Values are percentages of the full image so resizing preserves placement.
    {x:0.109,y:0.143,w:0.226,h:0.028},
    {x:0.604,y:0.143,w:0.286,h:0.028}
  ];

  appContext.CARD_IMAGE_STORAGE_BUCKET = "card-images";

  appContext.CARD_IMAGE_STORAGE_MAX_BYTES = 20*1024*1024;
}
