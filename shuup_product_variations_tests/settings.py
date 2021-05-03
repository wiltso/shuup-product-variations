# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
from shuup_workbench.settings.utils import get_disabled_migrations
from shuup_workbench.test_settings import *  # noqa

INSTALLED_APPS = list(locals().get("INSTALLED_APPS", [])) + [
    "shuup_product_variations",
]

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": "test_db.sqlite3"}}

MIGRATION_MODULES = get_disabled_migrations()
MIGRATION_MODULES.update({app: None for app in INSTALLED_APPS})
