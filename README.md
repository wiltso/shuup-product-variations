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

### index.js
  - create and delete combinations
  - initialize new product data with proper values
  - possibly update product data on updates
  - do not include inventory in data if the supplier is not stockable
  - for not stocked vendors should we give option to swithc?
  - add tool to price all children with one run
  - add tool to stock all children with one run
  - set max variations to 4 more then let's discuss

### currentVariable.js
  - update the product based on customer changes
  - do not show inventory option if there is no inventory in data
  - Add product default price update (regular and multivendor options)
    - Check currency precision from currency
    - Show currency on a field label

### productVariationOrganizer.js
  - Actually re-order and translate (rename) the variations

### admin
  - add marketplace staff view to edit the "placeholder variations"
  - make sure edit and create options can be switched with permissions
  - limit the section until product created
  - limit the section for products with exact one supplier


### After this addon:
    - Remove variations from shuup.admin (pretty much done)
    - Split product list to different menu items. Listing only normal products, variation parents,
      variation children, package products, subscriptions products. Then the current one lists
      "All products" but should be maybe available only for superusers in the future.
