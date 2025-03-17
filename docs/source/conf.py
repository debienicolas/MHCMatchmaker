# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

import os
import sys
sys.path.insert(0, os.path.abspath('../..'))

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'MHC-Matchmaker'
copyright = ''
author = 'Joseph M. Ladowski, Bruce Rogers and Nicolas De Bie'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

html_show_sourcelink = False
html_context = {
    'display_github': False,
    "show_source": False,
}

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'myst_parser',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinxcontrib.bibtex'
]

templates_path = ['_templates']
exclude_patterns = []
source_suffix = ['.rst', '.md']
autoclass_content = 'both'

bibtex_bibfiles = ['references.bib']

# customize the autodoc so it doesn't display the return type
napoleon_use_rtype = False

# Use type hints in the docstrings
autodoc_typehints = 'description'
autodoc_typehints_format = 'short'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_scaled_image_link = False

html_css_files = [
    'custom.css',
]

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "dollarmath",
    "amsmath",
    "html_image",
]
