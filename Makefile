TOPIC ?= 'new thing'
FILE = $(shell date "+./_posts/%Y-%m-%d-$(TOPIC).md" | sed -e y/\ /-/)

default: help

help:
	@echo Usage: make [new, build, deploy, setup-dev, serve]

new:
	echo "---" >> $(FILE)
	echo "title: $(TOPIC)" >> $(FILE)
	echo "layout: post" >> $(FILE)
	echo "published: false" >> $(FILE)
	echo "---" >> $(FILE)
	echo $(FILE)

deploy:
	s3cmd sync --add-header=Expires:max-age=604800 --exclude '.git/*' --acl-public _site/ s3://tylercipriani.com/
	s3cmd setacl --acl-public --mime-type=text/css s3://tylercipriani.com/styles/main-min.css
	s3cmd setacl --acl-public --mime-type=text/css s3://tylercipriani.com/styles/merkel-dag-d3.css

setup-dev:
	bundle -v || gem install bundler --no-rdoc --no-ri
	bundle install

build:
	bundle exec cssmin -s styles/main.css -d styles/main-min.css
	bundle exec jekyll build --destination '_site'

serve:
	bundle exec jekyll serve

.PHONY: deploy post dev build serve
