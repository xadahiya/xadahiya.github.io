# Normalizes heading levels in post bodies so the document outline is valid:
# the page title is the only <h1>, the post's top-level headings become <h2>,
# and a level is never skipped (h2 -> h4 becomes h2 -> h3). The markdown
# sources are left untouched; only the rendered HTML is adjusted.
Jekyll::Hooks.register [:posts, :pages], :post_convert do |doc|
  next unless %w[post page].include?(doc.data['layout'])

  html = doc.content
  levels = html.scan(/<h([1-6])[\s>]/).flatten.map(&:to_i)
  next if levels.empty?

  shift = 2 - levels.min
  prev = 1
  doc.content = html.gsub(%r{<h([1-6])(\s[^>]*)?>(.*?)</h\1>}m) do
    level = [[Regexp.last_match(1).to_i + shift, prev + 1].min, 2].max
    level = 6 if level > 6
    prev = level
    "<h#{level}#{Regexp.last_match(2)}>#{Regexp.last_match(3)}</h#{level}>"
  end
end
