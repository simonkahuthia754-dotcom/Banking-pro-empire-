package com.simon.bankingempire.nativead

import android.graphics.Color
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.ads.AdLoader
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView

/**
 * Renders a real Google AdMob Native Advanced ad as a native Android view,
 * positioned as an overlay matching a placeholder element's on-screen rectangle
 * in the web content (measured in JS via getBoundingClientRect and passed in
 * as CSS pixels, which this plugin converts to device pixels).
 *
 * This exists because @capacitor-community/admob (the plugin used for banner,
 * interstitial and rewarded ads elsewhere in this app) does not support the
 * Native Advanced ad format — Capacitor apps run inside a WebView, and native
 * ads require real native views, which is exactly what this plugin adds.
 */
@CapacitorPlugin(name = "NativeAdPlugin")
class NativeAdPlugin : Plugin() {

    private var currentAdView: NativeAdView? = null
    private var currentNativeAd: NativeAd? = null

    @PluginMethod
    fun showNativeAd(call: PluginCall) {
        val adId = call.getString("adId")
        val x = call.getDouble("x") ?: 0.0
        val y = call.getDouble("y") ?: 0.0
        val width = call.getDouble("width") ?: 0.0
        val height = call.getDouble("height") ?: 0.0

        if (adId == null || width <= 0 || height <= 0) {
            call.reject("showNativeAd requires adId, x, y, width, height")
            return
        }

        val activity = bridge.activity
        activity.runOnUiThread {
            val adLoader = AdLoader.Builder(activity, adId)
                .forNativeAd { nativeAd: NativeAd ->
                    // Clean up any previous ad before showing the new one.
                    removeCurrentAdView()
                    currentNativeAd = nativeAd

                    val inflater = activity.layoutInflater
                    val adView = inflater.inflate(
                        resources.getIdentifier("native_ad_layout", "layout", activity.packageName),
                        null
                    ) as NativeAdView

                    bindNativeAd(nativeAd, adView)

                    val density = activity.resources.displayMetrics.density
                    val params = FrameLayout.LayoutParams(
                        (width * density).toInt(),
                        (height * density).toInt()
                    )
                    params.leftMargin = (x * density).toInt()
                    params.topMargin = (y * density).toInt()
                    params.gravity = Gravity.TOP or Gravity.START

                    val rootContent = activity.findViewById<ViewGroup>(android.R.id.content)
                    rootContent.addView(adView, params)
                    currentAdView = adView

                    val ret = JSObject()
                    ret.put("shown", true)
                    call.resolve(ret)

                    val data = JSObject()
                    data.put("headline", nativeAd.headline)
                    notifyListeners("nativeAdLoaded", data)
                }
                .withAdListener(object : com.google.android.gms.ads.AdListener() {
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        val data = JSObject()
                        data.put("message", error.message)
                        notifyListeners("nativeAdFailed", data)
                        call.reject("Native ad failed to load: " + error.message)
                    }
                })
                .build()

            adLoader.loadAd(AdRequest.Builder().build())
        }
    }

    @PluginMethod
    fun hideNativeAd(call: PluginCall) {
        bridge.activity.runOnUiThread {
            removeCurrentAdView()
            call.resolve()
        }
    }

    private fun removeCurrentAdView() {
        currentAdView?.let { view ->
            (view.parent as? ViewGroup)?.removeView(view)
        }
        currentAdView = null
        currentNativeAd?.destroy()
        currentNativeAd = null
    }

    /** Binds a loaded NativeAd's assets onto the inflated NativeAdView's child views. */
    private fun bindNativeAd(nativeAd: NativeAd, adView: NativeAdView) {
        val headlineView = adView.findViewById<android.widget.TextView>(
            adView.resources.getIdentifier("ad_headline", "id", adView.context.packageName)
        )
        val bodyView = adView.findViewById<android.widget.TextView>(
            adView.resources.getIdentifier("ad_body", "id", adView.context.packageName)
        )
        val ctaView = adView.findViewById<android.widget.Button>(
            adView.resources.getIdentifier("ad_call_to_action", "id", adView.context.packageName)
        )
        val iconView = adView.findViewById<android.widget.ImageView>(
            adView.resources.getIdentifier("ad_icon", "id", adView.context.packageName)
        )

        headlineView.text = nativeAd.headline
        adView.headlineView = headlineView

        if (nativeAd.body == null) {
            bodyView.visibility = android.view.View.INVISIBLE
        } else {
            bodyView.visibility = android.view.View.VISIBLE
            bodyView.text = nativeAd.body
        }
        adView.bodyView = bodyView

        if (nativeAd.callToAction == null) {
            ctaView.visibility = android.view.View.INVISIBLE
        } else {
            ctaView.visibility = android.view.View.VISIBLE
            ctaView.text = nativeAd.callToAction
        }
        adView.callToActionView = ctaView

        val icon = nativeAd.icon
        if (icon == null) {
            iconView.visibility = android.view.View.GONE
        } else {
            iconView.setImageDrawable(icon.drawable)
            iconView.visibility = android.view.View.VISIBLE
        }
        adView.iconView = iconView

        // This line is required by AdMob policy — it hands the loaded NativeAd
        // object to the view so impressions/clicks are tracked correctly.
        adView.setNativeAd(nativeAd)
    }

    override fun handleOnDestroy() {
        bridge.activity.runOnUiThread { removeCurrentAdView() }
        super.handleOnDestroy()
    }
}
