import 'package:admin/utility/extensions.dart';

import '../../../core/data/data_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../utility/constants.dart';
import 'chart.dart';
import 'order_info_card.dart';

class OrderDetailsSection extends StatelessWidget {
  const OrderDetailsSection({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<DataProvider>(
      builder: (context, dataProvider, child) {
        //TODO: should complete Make this order number dynamic bt calling calculateOrdersWithStatus
        int totalOrder = context.dataProvider.calculateOrdersWithStatus();
        int pendingOrder = context.dataProvider.calculateOrdersWithStatus(status: 'pending');
        int processingOrder = context.dataProvider.calculateOrdersWithStatus(status: 'processing');
        int cancelledOrder = context.dataProvider.calculateOrdersWithStatus(status: 'canceled');
        int shippedOrder = context.dataProvider.calculateOrdersWithStatus(status: 'shipped');
        int deliveredOrder = context.dataProvider.calculateOrdersWithStatus(status: 'delivered');
        return Container(
          padding: EdgeInsets.all(defaultPadding),
          decoration: BoxDecoration(
            color: secondaryColor,
            borderRadius: const BorderRadius.all(Radius.circular(10)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Chi tiết đơn hàng",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: defaultPadding),
              Chart(),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery1.svg",
                title: "Tất cả đơn hàng",
                totalOrder: totalOrder,
              ),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery5.svg",
                title: "Đơn chưa giải quyết",
                totalOrder: pendingOrder,
              ),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery6.svg",
                title: "Đơn đang xử lý",
                totalOrder: processingOrder,
              ),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery2.svg",
                title: "Đơn đã huỷ",
                totalOrder: cancelledOrder,
              ),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery4.svg",
                title: "Đơn ship đã lấy hàng",
                totalOrder: shippedOrder,
              ),
              OrderInfoCard(
                svgSrc: "assets/icons/delivery3.svg",
                title: "Đơn hàng đã giao",
                totalOrder: deliveredOrder,
              ),
            ],
          ),
        );
      },
    );
  }
}
