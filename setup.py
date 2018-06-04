import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="django-adminx",
    version="2.0.2",
    author="kerol",
    author_email="ikerol@163.com",
    description="django extended admin",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/kerol/django-adminx",
    packages=setuptools.find_packages(),
    classifiers=(
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ),
    install_requires=[
        'Django>2.0.0',
        'django-crispy-forms>1.6.0',
        'django-reversion',
        'django-formtools',
        'xlwt',
        'xlsxwriter',
    ]
)
