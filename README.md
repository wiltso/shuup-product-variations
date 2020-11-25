# [DRAFT] Shuup Product Variations [DRAFT]

This package implements product variations for the [Shuup](https://shuup.com/) platform.

## Copyright

Copyright (C) 2012-2020 by Shoop Commerce Ltd. <support@shuup.com>

Shuup is International Registered Trademark & Property of Shoop Commerce Ltd.,
Business ID: FI27184225,
Business Address: Iso-Roobertinkatu 20-22, 00120 HELSINKI, Finland.

## License

Shuup Stripe addon is published under Open Software License version 3.0 (OSL-3.0).
See the LICENSE file distributed with Shuup.

## TODO

- Add button under product variations to organize the current product variables (clean, order and translate)
- Add admin view to organize all variations (clean, order and translate)

- Add product sku update
- Add product default price update (regular and multivendor options)
  - Check currency precision from currency
  - Show currency on a field label
- Add stock update.
- Make sure stock update is only available when suplier is stocked
- Add button to make supplier stocked
- Limit things so that this is only available when there is one supplier per product

- Add tool to price all children with one run
- Add tool to stock all children with one run

- [Biggest] add API to delete old variations and create new combinations
    - Plan is to soft delete the product and then mark the variation result unvisible
    - Also undelete if the combination comes available later day

- After this addon:
    - Remove variations from shuup.admin (pretty much done)
    - Split product list to different menu items. Listing only normal products, variation parents, variation children, package products, subscriptions products. Then the current one lists "All products" but should be maybe available only for superusers in the future.
