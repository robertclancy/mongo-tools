if (typeof getToolTest === 'undefined') {
  load('jstests/configs/plain_28.config.js');
}

(function() {
  var targetPath = "dbflags";
  resetDbpath(targetPath);
  var toolTest = getToolTest('dbFlagTest');
  var commonToolArgs = getCommonToolArguments();
  var db = toolTest.db.getSiblingDB('foo');

  db.dropDatabase();
  assert.eq(0, db.bar.count());
  db.getSiblingDB('baz').dropDatabase();
  assert.eq(0, db.getSiblingDB('baz').bar.count());

  // Insert into the 'foo' database
  db.bar.insert({x: 1});
  // and into the 'baz' database
  db.getSiblingDB('baz').bar.insert({x: 2});

  // Running mongodump with `--db foo` should only dump the
  // 'foo' database, ignoring the 'baz' database
  resetDbpath(targetPath);
  var dumpArgs = ['dump', '--db', 'foo']
    .concat(getDumpTarget(targetPath))
    .concat(commonToolArgs);
  assert.eq(toolTest.runTool.apply(toolTest, dumpArgs), 0,
    'mongodump should succeed with `--db foo`');
  db.dropDatabase();
  db.getSiblingDB('baz').dropDatabase();
  assert.eq(0, db.bar.count());
  assert.eq(0, db.getSiblingDB('baz').bar.count());

  var restoreArgs = ['restore']
    .concat(getRestoreTarget(targetPath))
    .concat(commonToolArgs);
  assert.eq(toolTest.runTool.apply(toolTest, restoreArgs), 0,
    'mongorestore should succeed');
  assert.eq(1, db.bar.count());
  assert.eq(0, db.getSiblingDB('baz').bar.count());

  toolTest.stop();
}());
