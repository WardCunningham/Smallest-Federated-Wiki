module RandomId
  def gen_id
    RandomId.generate
  end

  def self.generate
    (0..15).collect{(rand*16).to_i.to_s(16)}.join
  end
end
