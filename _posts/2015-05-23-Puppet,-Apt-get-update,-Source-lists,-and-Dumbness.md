---
title: Puppet, Apt-get update, Source lists, and Dumbness
layout: post
published: false
---

Configuration management software lets you be a little dumb. Puppet, Chef,
Ansible, and Salt have all managed to smooth down many of the non-obvious edges
of your terrible bash and perl scripts.

My main problem with configuration management software is that I'm _still_ dumb.
I'm still dumb and there are now new, non-obvious, ways to be dumb.

One non-obvious example is below:

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

On the surface, this little contrived example seems fine: Apache requires a
special source, adding that source triggers an apt-get update. Therefore, before
apache is installed, our sources list should be up-to-date, right? Wrong.

The problem here is subtle: the `notify => Exec['apt-get update']`
in the file resource means that the file `"/etc/apt/sources.d/${name}.list"` has to
exist before apt-get update is run. Adding
`require => File['/etc/apt/sources.list.d/some_source.list']`
to the apache package means that it will be installed only after `"/etc/apt/sources.d/${name}.list"`
gets added. **HOWEVER**, the apache package, currently, has no relationship with apt-get
update. This means puppet may try to install all apache packages _after_ adding
`/etc/apt/sources.d/some_source.list`, but _before_ running apt-get update.

While the short example above is not a problem in isolation, it _can be_ a
problem in a larger manifest. Puppet will succeed with some packages, fail in others, then
create unresolvable dependency conflicts (dependency hell) on the next run
(after apt-get update has run).
