# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Enter here all the changes made to the development version

### Fixed

- Fix so product variations works with suppliers having multiple supplier modules

### Changed

- Move isort to pyproject.toml

## [1.0.16] - 2021-05-11

### Fixed

- Prevent trying to save SKUs greater than 128 characters
- Return errors in a comma-separated list to make sure to return all of them

## [1.0.15] - 2021-05-04

### Changed

- Pull translations from Transifex

## [1.0.14] - 2021-05-04

### Changed

- Pull translations from Transifex
- Move CI to GHA and use Poetry as dependency manager

## [1.0.13] - 2021-04-19

### Added

- German translations from Transifex

## [1.0.12] - 2021-04-14

## [1.0.11] - 2021-04-14

## [1.0.9] - 2021-03-02

### Fixed

- Use `ugettext_lazy` instead of `ugettext`

## [1.0.8] - 2021-02-23

- Allow updating stock to zero
- Allow decimal places for stock
- Avoid scientific notation for price and stock

## [1.0.7] - 2021-02-19

### Added

- Add Swedish translations
- Add Finnish translations

## [1.0.6] - 2021-02-18

### Added

- When all variations are removed, turn product mode to Normal

## [1.0.5] - 2021-01-25

### Added

- Add Finnish translations
- Add all swedish translation and translated them

## [1.0.4] - 2021-01-05

- Check for Shuup multivendor

## [1.0.3] - 2020-12-22

- Fix bug with combination query when stock not enabled

## [1.0.1] - 2020-12-16

### Fixed

- Make sure to delete variables and values not being used

## [1.0.0] - 2020-12-16

### Added

- Initial version
