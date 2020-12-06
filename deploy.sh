JEKYLL_ENV=production jekyll build
cp CNAME _site/CNAME
git subtree push --prefix _site origin gh-pages