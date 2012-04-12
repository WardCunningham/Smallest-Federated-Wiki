my ($old, $new);

sub run {
  $trouble = `$_[0] 2>&1`;
  return unless $trouble;
  print "\n$_[0]\n$trouble";
  $trouble =~ / on line \d+/;
  `say having trouble$&.`;
}

while (sleep 1) {
  $new = `ls -lt *.coffee lib/*.coffee test/*.coffee`;
  next if $old eq $new;
  $old = $new;
  run 'say client& browserify client.coffee -o client.js';
  run 'say test& browserify testclient.coffee -o test/testclient.js';
  `say done.&`;
}
