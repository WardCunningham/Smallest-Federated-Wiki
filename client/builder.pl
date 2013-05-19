#!/usr/bin/perl

#this script exists because the browserify -w option does not appear to work?

my ($old, $new);
my $OSXsay = ($^O eq 'darwin');

sub say {
    my $msg = shift;
    if ($OSXsay) {
        `say $msg&`;
    }
    print $msg."\n";
}
sub run {
  $trouble = `($_[0] || echo 'failed to run') 2>&1`;
  return unless $trouble;
  if ($trouble =~ /( on line \d+)/) {
    say("having trouble $1.");
    print "\n$_[0]\n$trouble";
  }elsif ($trouble =~ /failed to run/) {
    say('failed to run');
    print("\n$_[0]\n$trouble");
  }

}

while (sleep 1) {
  $new = `ls -lt *.coffee lib/*.coffee test/*.coffee plugins/*/*.coffee`;
  next if $old eq $new;
  $old = $new;
  print `clear; date`;
  say('client.');
  run('./node_modules/.bin/browserify -t coffeeify client.coffee --debug > client.js');
  say('test.');
  run('./node_modules/.bin/browserify -t coffeeify testclient.coffee ./plugins/*/test.coffee --debug > test/testclient.js');
  say('plugins.');
  run('./node_modules/.bin/coffee -c ./plugins/*.coffee');
  run('./node_modules/.bin/coffee -c ./plugins/*/*.coffee');
  say('done.');
}
