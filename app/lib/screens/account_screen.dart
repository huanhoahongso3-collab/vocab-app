import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';

/// Subscription product id; create the same id in Google Play Console and App Store Connect.
const premiumProductId = 'premium_monthly';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, required this.api, required this.store, required this.me, required this.onChanged, required this.onSignOut});
  final ApiClient api;
  final SavedStore store;
  final Me me;
  final Future<void> Function() onChanged;
  final Future<void> Function() onSignOut;
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  StreamSubscription<List<PurchaseDetails>>? _sub;
  String? message;
  bool busy = false;

  bool get storeSupported => !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  @override
  void initState() {
    super.initState();
    if (storeSupported) {
      _sub = InAppPurchase.instance.purchaseStream.listen(_onPurchases, onError: (_) => setState(() => message = 'Giao dịch thất bại.'));
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _onPurchases(List<PurchaseDetails> list) async {
    for (final p in list) {
      if (p.status == PurchaseStatus.error) {
        setState(() {
          message = 'Giao dịch thất bại: ${p.error?.message ?? ''}';
          busy = false;
        });
      } else if (p.status == PurchaseStatus.purchased || p.status == PurchaseStatus.restored) {
        try {
          // The server re-checks the purchase with Google/Apple; we never trust the client alone.
          if (Platform.isAndroid) {
            await widget.api.verifyGoogle(p.productID, p.verificationData.serverVerificationData);
          } else {
            await widget.api.verifyApple(p.purchaseID ?? '');
          }
          await widget.onChanged();
          setState(() => message = 'Đã kích hoạt Premium. Cảm ơn bạn!');
        } on ApiError catch (e) {
          setState(() => message = e.message);
        }
        if (p.pendingCompletePurchase) await InAppPurchase.instance.completePurchase(p);
        if (mounted) setState(() => busy = false);
      }
    }
  }

  Future<void> buy() async {
    setState(() {
      busy = true;
      message = null;
    });
    final iap = InAppPurchase.instance;
    if (!await iap.isAvailable()) {
      setState(() {
        busy = false;
        message = 'Cửa hàng ứng dụng không khả dụng.';
      });
      return;
    }
    final res = await iap.queryProductDetails({premiumProductId});
    if (res.productDetails.isEmpty) {
      setState(() {
        busy = false;
        message = 'Chưa tìm thấy gói Premium trên cửa hàng.';
      });
      return;
    }
    await iap.buyNonConsumable(purchaseParam: PurchaseParam(productDetails: res.productDetails.first));
  }

  Future<void> sync() async {
    setState(() {
      busy = true;
      message = null;
    });
    try {
      await widget.store.sync(widget.api);
      setState(() => message = 'Đã đồng bộ.');
    } on ApiError catch (e) {
      setState(() => message = e.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = widget.me;
    final expires = me.expiresAt == null ? null : DateTime.fromMillisecondsSinceEpoch(me.expiresAt!);
    return ListView(padding: const EdgeInsets.all(16), children: [
      ListTile(leading: const Icon(Icons.account_circle, size: 40), title: Text(me.name.isEmpty ? me.email : me.name), subtitle: Text(me.email)),
      Card(
        child: ListTile(
          leading: Icon(me.premium ? Icons.workspace_premium : Icons.lock_outline),
          title: Text(me.premium ? 'Premium' : 'Gói miễn phí'),
          subtitle: Text(me.premium
              ? 'Hết hạn / gia hạn: ${expires?.toLocal().toString().split(' ').first ?? '-'}'
              : '${me.quotaLimit} lượt/ngày · level B2 · 6 chủ đề · lưu tối đa $freeSavedLimit từ'),
        ),
      ),
      if (!me.premium) ...[
        const SizedBox(height: 8),
        const Text('Premium: 30 lượt/ngày, level B2 + C1, chủ đề tự nhập, thẻ đầy đủ (IPA, collocations, ví dụ dịch), lưu không giới hạn, đồng bộ nhiều thiết bị.'),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: busy || !storeSupported ? null : buy,
          child: Text(storeSupported ? 'Nâng cấp Premium' : 'Mua Premium trên ứng dụng Android/iOS'),
        ),
      ],
      if (me.canSync) OutlinedButton.icon(onPressed: busy ? null : sync, icon: const Icon(Icons.sync), label: const Text('Đồng bộ từ đã lưu')),
      if (message != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(message!)),
      const Divider(height: 32),
      TextButton.icon(onPressed: widget.onSignOut, icon: const Icon(Icons.logout), label: const Text('Đăng xuất')),
    ]);
  }
}
