---
layout: post
title: Development Environments with Vagrant, Docker, and Supervisord
---

I&#8217;ve used Vagrant a fair amount in my day, and it&#8217;s great. I
enjoy being able to spin-up toy linux environments to test out ideas.
I tend to use the [Chef provisioner](http://docs.vagrantup.com/v2/provisioning/chef_solo.html) with Vagrant
to build-out a local environment that matches my server fairly closely.

My Ever-Evolving Rant About DevOps
---

I&#8217;ve been thinking about Chef a lot lately. Often is the time, in moments of
profound frustration, that I&#8217;ve
had the thought that Chef is nothing more than a useless, leaky abstraction that separates me
from something I know fairly well&#8212;Linux.

This thought is usually fleeting: Chef provides many needed abstractions that
are, ultimately, much easier to grok than the underlying Linux system. Further,
Chef allows you to keep a(n ostensibly) well-tested system under version control.

I&#8217;ve come to the realization that my problem with Chef is not really a problem
with Chef, but a [problem with Linux itself](https://www.domenkozar.com/2014/03/11/why-puppet-chef-ansible-arent-good-enough-and-we-can-do-better/).

Linux system administration is difficult because Linux
commands are non-deterministic and rely heavily on system
state (e.g., installed software, permissions, network settings and availability).
Maintaining a bare-metal, long-running server non-interactively using Chef
sucks because [any hand-tinkering via ssh](http://me.andering.com/2011/02/03/server-login-considered-harmful/) is going to fuck with the &#8220;state&#8221; of
the system&#8212;creating different results for subsequent chef-client runs.
This system state adjustment may or may not be reflected in the chef repository (which
double sucks).

Why Docker Curtails My Rage
---

I started to think about Docker. I feel Docker addresses
the problem of program state better than other currently available solutions
(although, [Nix](https://nixos.org/nixos/) is looking pretty promising as well). While Docker is
still a Linux system&#8212;and, ipso facto, state-dependant&#8212;it&#8217;s also
ephemeral and therefore, by not persisting changes to state, Docker has
created a previously unavailable (on bare metal hardware), lightweight
workaround to the problem of system state.

As is my wont, I decided today to play a bit with Docker on Vagrant and, lo-and-below,
I found that the newest version of Vagrant (1.6.2, as of May 26th) can actually use [docker as a _provider_](https://www.vagrantup.com/blog/feature-preview-vagrant-1-6-docker-dev-environments.html),
that is, as an alternative to VirtualBox. Using Docker as a provider means
that you can run a fully-independent development enviroment, on your host
machine without the overhead of VirtualBox. Neat.

&#8220;Imma setup a local development environment for Ubuntu 14.04, nginx and php-fpm
using Vagrant, Supervisord and Docker,&#8221; says I.

Project Layout
---

To keep my project directory nice and tidy, I&#8217;ve separated-out most of the
files needed by the Docker provider into a `Docker` folder. This
results in the directory structure below.

{% highlight bash %}
├── Docker
│   ├── Dockerfile
│   ├── nginx
│   │   └── default
│   ├── php-fpm
│   │   └── php-fpm.conf
│   └── supervisor
│       └── supervisord.conf
├── Vagrantfile
└── www
    └── index.php
{% endhighlight %}

The `Dockerfile` is used to build the main docker machine and the subfolders
in the `Docker` directory contain configuration used in the `Dockerfile`.

The `www` folder is my fake php project folder.

VagrantFile
---

Since docker handles so much of what was previously handled by Vagrant provisioner,
the `Vagrantfile` for a Docker-backed Vagrant instance is pretty sparse.

In mine, I&#8217;ve got:
{% highlight ruby %}
Vagrant.configure(2) do |config|
  config.vm.synced_folder "./www", "/var/www"   # Sync'd folder

  config.vm.provider "docker" do |d|
    d.build_dir = "./Docker" # specifies the path to the Dockerfile
    d.ports << '8080:80'     # Forwards port 8080 from the host to the Docker Container port 80
  end
end
{% endhighlight %}

Dockerfile
---

Most of the work of provisioning a container is handled by Docker and
the Dockerfile. In fact, if you were only ever going to run this container on a Linux machine, I
don&#8217;t think that Vagrant adds any needed functionality to the `docker.io` cli.
In terms of portability, however, Vagrant is, at this time, a necessary evil
to run docker on OSX and Windows.

{% highlight bash %}
FROM ubuntu:latest

MAINTAINER Tyler Cipriani, tyler@tylercipriani.com

# Download and install php, nginx, and supervisor, hey, just linux for a change!
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:nginx/stable
RUN apt-get update
RUN apt-get -y dist-upgrade
RUN apt-get install -y php5-fpm nginx supervisor

# Setup config files
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./nginx/default /etc/nginx/sites-enabled/default
ADD ./supervisor/supervisord.conf /etc/supervisor/supervisord.conf
ADD ./php-fpm/php-fpm.conf /etc/php5/fpm/php-fpm.conf

# Shared volume
RUN mkdir -p /var/www
VOLUME ["/var/www"]

# Default command for container, start supervisor
CMD ["supervisord", "--nodaemon"]
USER root

# Expose port 80 of the container
EXPOSE 80
{% endhighlight %}

This `Dockerfile` takes care of building a docker container from the latest
Ubuntu image (14.04 as of May 26th, 2014). Running this code installs:

* Nginx 1.6.0
* PHP 5.5.9
* Supervisor

This config also starts supervisor with the `--nodaemon` flag by default.
Docker can run a container running a non-daemonized program as a daemon
(much like supervisor can run non-daemonized programs as daemons).
Supervisor is used as a way of running both nginx and php-fpm as non-daemonized
programs. It is also noteworthy that the dockerfile creates and/or modifies configuration files for php-fpm and nginx
to make sure they both run in non-daemon mode.

`nginx/default`

{% highlight nginx %}
server {
  listen 80 default_server;

  root  /var/www;
  index index.php index.html;

  # pass the PHP scripts to FastCGI server
  location ~ \.php$ {
    try_files $uri =404;
    fastcgi_split_path_info ^(.+\.php)(/.+)$;
    fastcgi_pass unix:/var/run/php5-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
  }
}
{% endhighlight %}

`php-fpm/php-fpm.conf`

{% highlight ini %}
[global]
pid = /var/run/php5-fpm.pid
error_log = /var/log/php5-fpm.log
daemonize = no

include=/etc/php5/fpm/pool.d/*.conf
{% endhighlight %}

`supervisor/supervisord.conf`

{% highlight ini %}
[unix_http_server]
file=/var/run/supervisor.sock   ; (the path to the socket file)
chmod=0700                       ; sockef file mode (default 0700)

[supervisord]
logfile=/tmp/supervisord.log ; (main log file;default $CWD/supervisord.log)
logfile_maxbytes=50MB        ; (max main logfile bytes b4 rotation;default 50MB)
logfile_backups=10           ; (num of main logfile rotation backups;default 10)
loglevel=info                ; (log level;default info; others: debug,warn,trace)
pidfile=/tmp/supervisord.pid ; (supervisord pidfile;default supervisord.pid)
nodaemon=false               ; (start in foreground if true;default false)
minfds=1024                  ; (min. avail startup file descriptors;default 1024)
minprocs=200                 ; (min. avail process descriptors;default 200)

; the below section must remain in the config file for RPC
; (supervisorctl/web interface) to work, additional interfaces may be
; added by defining them in separate rpcinterface: sections
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock ; use a unix:// URL  for a unix socket

[program:php5-fpm]
command=/usr/sbin/php5-fpm -c /etc/php5/fpm
stdout_events_enabled=true
stderr_events_enabled=true

[program:nginx]
command=/usr/sbin/nginx
stdout_events_enabled=true
stderr_events_enabled=true
{% endhighlight %}

Jam Time
---

With all of our configuration in place there isn&#8217;t much left to do aside
from running the vagrant instance and allowing docker to create our container.

{% highlight bash %}
$ sudo docker pull ubuntu # to grab the latest Ubuntu image, Vagrant should probably do this but doesn't
$ sudo vagrant up --provider=docker --debug # use debug if you don't want to sit waiting with no info for a long time on the first run
{% endhighlight %}

With that, you now have a container running nginx and php-fpm that is sharing
a folder with you at `/var/www`. Navigating to `http://localhost:8080/index.php`
should show you the contents of your `./www/index.php` file.

This process is really simple AND super lightweight. I&#8217;ve been running my
docker/vagrant instance for about 45 minutes alongside chrome and tmux/xterm
without any noticeable jankyness on a notoriously janky laptop.