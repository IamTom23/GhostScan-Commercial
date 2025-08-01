# 🔍 Extension Connection Troubleshooting Checklist

## ❌ **Current Issue:**
```
❌ Connection failed: Could not establish connection. Receiving end does not exist.
```

## 📋 **Step-by-Step Troubleshooting:**

### **Step 1: Verify Extension is Loaded**
- [ ] Go to `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle in top right)
- [ ] Look for "GhostScan Privacy Tool" in the list
- [ ] Verify it shows as "Enabled" (toggle is ON)
- [ ] Note the extension ID shown under the extension name

**If extension is NOT listed:**
- [ ] Click "Load unpacked"
- [ ] Navigate to: `GhostScan-Commercial/apps/extension/dist`
- [ ] Select the `dist` folder
- [ ] Extension should appear with a new ID

### **Step 2: Check Extension Files**
- [ ] Verify `dist` folder contains:
  - [ ] `manifest.json`
  - [ ] `background.js`
  - [ ] `content.js`
  - [ ] `popup.html`
  - [ ] `popup.css`
  - [ ] `popup.js`

### **Step 3: Test Extension ID**
- [ ] Open: `http://localhost:5178/debug-extension.html`
- [ ] Click "List Extensions" to see all installed extensions
- [ ] Copy the correct extension ID for "GhostScan Privacy Tool"
- [ ] Test the extension ID using the debug page

### **Step 4: Check Extension Background Script**
- [ ] In `chrome://extensions/`, click "Inspect views: service worker"
- [ ] Check console for any error messages
- [ ] Look for: "🔍 GhostScan Background Service Worker loaded"
- [ ] Verify message listeners are working

### **Step 5: Test Extension Popup**
- [ ] Click the extension icon in Chrome toolbar
- [ ] Popup should open without errors
- [ ] Check popup console for any issues

### **Step 6: Update Extension ID in Files**
If you found a different extension ID:
- [ ] Run: `.\update-extension-id.bat`
- [ ] Enter the correct extension ID when prompted
- [ ] Verify files are updated:
  - [ ] `src/services/extensionService.ts`
  - [ ] `src/App.tsx`
  - [ ] `public/extension-test.html`

## 🔧 **Common Issues & Solutions:**

### **Issue 1: Extension Not Loading**
```
Error: "Manifest file is missing or unreadable"
```
**Solution:**
- Ensure all files are in `dist/` folder
- Check file permissions
- Verify `manifest.json` is valid

### **Issue 2: Extension ID Mismatch**
```
Error: "Could not establish connection. Receiving end does not exist."
```
**Solution:**
- Get correct extension ID from `chrome://extensions/`
- Update all files with correct ID
- Reload extension after updating

### **Issue 3: Extension Not Responding**
```
Error: "No response received"
```
**Solution:**
- Check background script console for errors
- Verify message listeners are working
- Reload extension

### **Issue 4: Chrome APIs Not Available**
```
Error: "Chrome runtime not available"
```
**Solution:**
- Ensure page is served from `http://localhost:5178/`
- Not from `file:///` URLs
- Check browser console for CORS errors

## 🎯 **Expected Results:**

### **✅ Successful Extension Load:**
```
✅ Extension appears in chrome://extensions/
✅ Extension shows as "Enabled"
✅ Background script loads without errors
✅ Popup opens without errors
```

### **✅ Successful Connection:**
```
✅ Chrome APIs detected
✅ Extension ID found and tested
✅ PING response received: {"success":true,"message":"PONG"}
✅ Extension connected successfully!
```

### **✅ Successful Scan:**
```
✅ START_SCAN message sent
✅ Scan completed successfully!
✅ Results returned to dashboard
```

## 📞 **Quick Commands:**

### **Test Extension Directly:**
```javascript
// In browser console on http://localhost:5178/
chrome.runtime.sendMessage('EXTENSION_ID_HERE', {action: 'PING'}, (response) => {
  console.log('Extension response:', response);
});
```

### **Check Extension Status:**
```javascript
// In browser console
chrome.management.getAll((extensions) => {
  extensions.forEach(ext => {
    if (ext.name.includes('GhostScan')) {
      console.log('GhostScan extension:', ext);
    }
  });
});
```

## 🚀 **Next Steps After Fix:**

1. **Test Connection:** Verify extension responds to PING
2. **Test Scan:** Trigger a privacy scan
3. **Test Dashboard:** Ensure dashboard displays real data
4. **Test UI:** Verify all dashboard features work
5. **Test Real Sites:** Scan actual websites for privacy issues

---

**🎉 Once all checks pass, your GhostScan extension and dashboard will be fully connected and functional!** 