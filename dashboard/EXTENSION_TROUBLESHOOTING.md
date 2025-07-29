# GhostScan Extension Connection Troubleshooting

## Issue: "❌ Extension Unavailable"

If you're seeing "❌ Extension Unavailable" in the dashboard, follow these steps to troubleshoot:

### Step 1: Check Extension Installation

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Look for "GhostScan Privacy Tool"
   - Make sure it's **enabled** (toggle switch is ON)

2. **Verify Extension is Working**
   - Click the GhostScan extension icon in your toolbar
   - You should see the debug popup
   - Test the "Test Chrome API" button

### Step 2: Check Dashboard Debug Info

1. **Open Debug Panel**
   - Click the 🔧 button next to the extension status
   - Check each debug item:

   - **Chrome Available**: Should be ✅
   - **Runtime Available**: Should be ✅  
   - **Storage Available**: Should be ✅
   - **Test Message Sent**: Should be ✅
   - **Extension Installed**: Should be ✅

2. **Test Connection**
   - Click "Test Connection" button
   - Check the alert message for details

### Step 3: Common Issues & Solutions

#### Issue: Chrome APIs Not Available
**Symptoms**: Chrome Available ❌, Runtime Available ❌
**Solution**: 
- Make sure you're using Chrome browser
- Try refreshing the dashboard page
- Check if you're in an incognito/private window

#### Issue: Extension Not Responding
**Symptoms**: Test Message Sent ❌, Extension Installed ❌
**Solution**:
- Refresh the extension in `chrome://extensions/`
- Click the refresh/reload button on the extension
- Restart Chrome browser

#### Issue: Extension Not Installed
**Symptoms**: Extension not found in `chrome://extensions/`
**Solution**:
- Follow the installation guide in the extension folder
- Load the extension from `dist` folder
- Make sure all files are present

### Step 4: Manual Testing

1. **Test Extension Independently**
   - Click extension icon
   - Run "Test Scan" in debug popup
   - Verify it shows real data

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for `[ExtensionService]` messages
   - Check for any error messages

3. **Verify File Structure**
   ```
   GhostScan-Commercial/apps/extension/dist/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── debug-popup.html
   └── debug-popup.js
   ```

### Step 5: Advanced Troubleshooting

#### Clear Extension Data
1. Go to `chrome://extensions/`
2. Find GhostScan extension
3. Click "Details"
4. Click "Clear data"

#### Reinstall Extension
1. Remove extension from `chrome://extensions/`
2. Clear browser cache
3. Reload extension from `dist` folder

#### Check Permissions
Make sure extension has these permissions:
- storage
- cookies
- tabs
- activeTab
- scripting
- webNavigation
- identity

### Step 6: Expected Behavior

When working correctly, you should see:

1. **Extension Status**: 🔗 Extension Connected
2. **Debug Info**: All items showing ✅
3. **Test Connection**: "SUCCESS" message
4. **Real Data**: Dashboard shows actual browser data

### Step 7: Fallback Behavior

If extension is unavailable:
- Dashboard falls back to mock data
- "Start Scan" shows simulated progress
- All features work with demo data
- Extension status shows appropriate message

### Still Having Issues?

1. **Check Console Logs**: Look for detailed error messages
2. **Verify Chrome Version**: Make sure you're using a recent version
3. **Try Different Browser**: Test with a fresh Chrome profile
4. **Check File Permissions**: Ensure extension files are readable

### Contact Support

If you're still experiencing issues:
1. Note down the debug info from the panel
2. Check browser console for error messages
3. Try the troubleshooting steps above
4. Report the specific error messages you're seeing 