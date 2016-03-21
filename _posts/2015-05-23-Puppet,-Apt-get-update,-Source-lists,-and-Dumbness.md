---
title: On Puppet, apt-get update, Source Lists, and Dumbness
layout: post
---

Configuration management software is nice because it lets you be a little dumb.
Puppet, Chef, Ansible, and Salt have all managed to smooth down many of the
rough edges that were ubiquitous in the terrible bash and perl
scripts used for old-time, ad-hoc configuration management.

My main problem with configuration management software is that _I'm still dumb_.
I'm still dumb and there are now new, non-obvious, ways to be dumb.

One non-obvious example is below:

{% highlight puppet %}
package { 'apache':
    ensure  => installed,
    require => File['/etc/apt/sources.list.d/some_source.list']
}

file { '/etc/apt/sources.list.d/some_source.list':
    notify => Exec['apt-get update'],
    source => ...
}

exec { 'apt-get update': }

...
{% endhighlight %}

On the surface, this little contrived example seems fine: Apache requires a
special source, adding that source triggers an `apt-get update`. Therefore, before
Apache is installed, our sources list should be up-to-date, right? Wrong.

The problem here is subtle: the `notify => Exec['apt-get update']`
in the file resource means that the file `"/etc/apt/sources.d/${name}.list"` has to
exist before `apt-get update` is run. Adding
`require => File['/etc/apt/sources.list.d/some_source.list']`
to the Apache package means that it will be installed only after `"/etc/apt/sources.d/${name}.list"`
gets added.

**HOWEVER**, the Apache package, currently, has no relationship with `apt-get update`.
This means Puppet may try to install the Apache package _after_ adding
`/etc/apt/sources.d/some_source.list`, but _before_ running `apt-get update`.

While the short example above is not a problem in isolation, it _can be_ a
problem in a larger manifest. Puppet will succeed with some packages, fail in others, then
create [unresolvable dependency conflicts](http://en.wikipedia.org/wiki/Dependency_hell)
on the next run (after `apt-get update` has run).

>**Edit**&#8212;2016-03-20
>
> This relationship is easier to see when you take advantage of puppet's
> `--graph` ability:
> {% highlight bash %}
> puppet apply --graph test.pp
> dot -Tpng /var/lib/puppet/state/graphs/relationships.dot -o Pictures/relationships.png
> {% endhighlight %}
>
> ![Puppet relationship graph](/images/2016/2016-03-20_puppet-dot.png)

