JEKYLL_ENV=production 
bundle exec jekyll clean
jekyll build
# cp CNAME _site/CNAME
git add .
git subtree push --prefix _site origin ghpages