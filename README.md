# Shuup Product Variations

This package implements product variations for the [Shuup](https://shuup.com/) platform.

## Copyright

Copyright (C) 2012-2020 by Shoop Commerce Ltd. <support@shuup.com>

Shuup is International Registered Trademark & Property of Shoop Commerce Ltd.,
Business ID: FI27184225,
Business Address: Iso-Roobertinkatu 20-22, 00120 HELSINKI, Finland.

## License

Shuup Stripe addon is published under Open Software License version 3.0 (OSL-3.0).
See the LICENSE file distributed with Shuup.

### Documentation

#### Implements a tab available at the product edit view
  - Create product variations for the product created
  - Available only when there is exactly one supplier set for product
  - Allow selecting sku for all children
  - Allow setting price for all children
  - Allow setting stock value when supplier is using `shuup.simple_supplier` supplier module and is stock managed
  - Allow easy access to children to further edit it content. Like adding custom images
  - Allow ordering for these product variable and variable value options
  - Allow translating these product variable and variable value options

#### Implements an admin orgnanizer view to add/edit default variation options for the products
  - Allow adding new variables and variable values which will be shown as options at product tab
  - Allow ordering these variables and variable values
  - Allow translating these variables and variable values
  
#### Permissions
  - For marketplace staff users add permission to variable organizer
  - For vendors or the users managing products add permissions to create and update the product variations.
  - Create option allows user option to create new variable and variable options for product instead using defaults managed through organizer by staff
  - Update option allows user to manage product variations. Disable this permission when you want to give user option to only update the variations itself but not affect variables or variable values available.
  
  
