# Gives generic link text ("here", "click here", "link", ...) in posts a
# screen-reader-only description of where the link goes, so the link makes
# sense out of context. The visible prose is unchanged.
require 'uri'

Jekyll::Hooks.register [:posts, :pages], :post_convert do |doc|
  next unless %w[post page].include?(doc.data['layout'])

  generic = /\A\s*(here|click here|this|this link|link|read more|more)\s*\z/i
  doc.content = doc.content.gsub(%r{<a\s([^>]*?)href="([^"]+)"([^>]*)>(.*?)</a>}m) do
    attrs_before, href, attrs_after, text = Regexp.last_match.captures
    if text =~ generic
      label = begin
        u = URI.parse(href)
        u.host ? (u.host.sub(/\Awww\./, '') + u.path.to_s.sub(%r{/\z}, '')) : href
      rescue URI::InvalidURIError
        href
      end
      %(<a #{attrs_before}href="#{href}"#{attrs_after}>#{text}<span class="sr-only"> — #{label}</span></a>)
    else
      Regexp.last_match(0)
    end
  end
end
