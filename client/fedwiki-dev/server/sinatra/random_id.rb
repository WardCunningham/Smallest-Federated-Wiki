module RandomId
  def self.generate
    (0..15).collect{(rand*16).to_i.to_s(16)}.join
  end
end
